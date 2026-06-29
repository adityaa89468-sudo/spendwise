import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Group, Expense, Settlement, GroupMember, InventoryItem, ChoreTask, WishlistItem, EventFund, ExpenseSplit, AppNotification } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface RoomContextType {
  currentGroup: Group | null;
  expenses: Expense[];
  settlements: Settlement[];
  notifications: AppNotification[];
  loadingGroup: boolean;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<boolean>;
  addExpense: (title: string, amount: number, category: string, splitType: 'equal' | 'percentage' | 'selected', splits: any, payerId?: string, payerName?: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addSettlement: (fromId: string, fromName: string, toId: string, toName: string, amount: number, upiTxnId?: string) => Promise<void>;
  markSettlementCompleted: (settlementId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addInventoryItem: (name: string, quantity: string) => Promise<void>;
  updateInventoryStatus: (itemId: string, status: 'good' | 'low' | 'out') => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addChoreTask: (title: string, assignedTo: string[], dueDate: string) => Promise<void>;
  toggleChoreTask: (taskId: string) => Promise<void>;
  deleteChoreTask: (taskId: string) => Promise<void>;
  addWishlistItem: (name: string, estimatedPrice: number) => Promise<void>;
  voteWishlistItem: (itemId: string) => Promise<void>;
  deleteWishlistItem: (itemId: string) => Promise<void>;
  addEventFund: (title: string, description: string, targetAmount: number, date: string) => Promise<void>;
  contributeToEventFund: (fundId: string, amount: number) => Promise<void>;
  deleteEventFund: (fundId: string) => Promise<void>;
  suggestedSettlements: Array<{ fromId: string; fromName: string; toId: string; toName: string; amount: number }>;
  memberBalances: { [uid: string]: number };
  resetGroup: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Error helper conforming to Firebase skill
const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [suggestedSettlements, setSuggestedSettlements] = useState<any[]>([]);
  const [memberBalances, setMemberBalances] = useState<{ [uid: string]: number }>({});

  // 1. Listen for Group data when User's active group changes
  useEffect(() => {
    if (!user || !profile?.currentGroupId) {
      setCurrentGroup(null);
      setExpenses([]);
      setSettlements([]);
      setNotifications([]);
      setLoadingGroup(false);
      return;
    }

    setLoadingGroup(true);
    const groupPath = `groups/${profile.currentGroupId}`;
    
    // Listen to current Group document
    const unsubGroup = onSnapshot(doc(db, 'groups', profile.currentGroupId), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentGroup({ id: snapshot.id, ...snapshot.data() } as Group);
      } else {
        console.warn("User belongs to a group that no longer exists.");
        setCurrentGroup(null);
      }
      setLoadingGroup(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, groupPath);
      setLoadingGroup(false);
    });

    // Listen to Expenses
    const expensesPath = `groups/${profile.currentGroupId}/expenses`;
    const unsubExpenses = onSnapshot(collection(db, expensesPath), (snapshot) => {
      const expList: Expense[] = [];
      snapshot.forEach(doc => {
        expList.push({ id: doc.id, ...doc.data() } as Expense);
      });
      // Sort expenses by date descending
      expList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(expList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, expensesPath);
    });

    // Listen to Settlements
    const settlementsPath = `groups/${profile.currentGroupId}/settlements`;
    const unsubSettlements = onSnapshot(collection(db, settlementsPath), (snapshot) => {
      const setList: Settlement[] = [];
      snapshot.forEach(doc => {
        setList.push({ id: doc.id, ...doc.data() } as Settlement);
      });
      setList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSettlements(setList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, settlementsPath);
    });

    // Listen to Notifications
    const notificationsPath = `groups/${profile.currentGroupId}/notifications`;
    const unsubNotifications = onSnapshot(
      query(collection(db, notificationsPath), where('toUid', '==', user.uid)),
      (snapshot) => {
        const notifList: AppNotification[] = [];
        snapshot.forEach(doc => {
          notifList.push({ id: doc.id, ...doc.data() } as AppNotification);
        });
        notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifList);
      },
      (error) => {
        console.error("Notifications list error:", error);
      }
    );

    return () => {
      unsubGroup();
      unsubExpenses();
      unsubSettlements();
      unsubNotifications();
    };
  }, [user, profile?.currentGroupId]);

  // 2. Recalculate Balance Network (Splitwise Debt simplification algorithm)
  useEffect(() => {
    if (!currentGroup || currentGroup.members.length === 0) {
      setSuggestedSettlements([]);
      setMemberBalances({});
      return;
    }

    // Initialize all members with 0 balance
    const balances: { [uid: string]: number } = {};
    const memberNames: { [uid: string]: string } = {};
    
    currentGroup.members.forEach(m => {
      balances[m.uid] = 0;
      memberNames[m.uid] = m.displayName;
    });

    // Process all active expenses to find net credit/debits
    expenses.forEach(exp => {
      const amount = exp.amount;
      const payerId = exp.payerId;
      
      // Person who paid gets credited the amount
      if (balances[payerId] !== undefined) {
        balances[payerId] += amount;
      }

      // People who owe gets debited their share
      exp.splits.forEach(split => {
        if (balances[split.uid] !== undefined) {
          balances[split.uid] -= split.amount;
        }
      });
    });

    // Adjust for completed settlements
    settlements.forEach(settle => {
      if (settle.status === 'settled') {
        const from = settle.fromId;
        const to = settle.toId;
        const amount = settle.amount;
        if (balances[from] !== undefined) balances[from] += amount;
        if (balances[to] !== undefined) balances[to] -= amount;
      }
    });

    setMemberBalances(balances);

    // Run simplifies settlement matchmaker
    const debtors: Array<{ uid: string; displayName: string; amount: number }> = [];
    const creditors: Array<{ uid: string; displayName: string; amount: number }> = [];

    Object.keys(balances).forEach(uid => {
      const bal = balances[uid];
      // Due to floating point calculations, ignore under ₹1 gap
      if (bal < -1) {
        debtors.push({ uid, displayName: memberNames[uid] || 'Roommate', amount: -bal });
      } else if (bal > 1) {
        creditors.push({ uid, displayName: memberNames[uid] || 'Roommate', amount: bal });
      }
    });

    // Sort: debtors with most debt first, creditors with most credit first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const suggest: Array<{ fromId: string; fromName: string; toId: string; toName: string; amount: number }> = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmt = Math.min(debtor.amount, creditor.amount);
      if (settleAmt > 0.5) {
        suggest.push({
          fromId: debtor.uid,
          fromName: debtor.displayName,
          toId: creditor.uid,
          toName: creditor.displayName,
          amount: Math.round(settleAmt)
        });
      }

      debtor.amount -= settleAmt;
      creditor.amount -= settleAmt;

      if (debtor.amount < 0.5) dIdx++;
      if (creditor.amount < 0.5) cIdx++;
    }

    setSuggestedSettlements(suggest);
  }, [currentGroup, expenses, settlements]);

  // 3. Create Group / hostel Room
  const createGroup = async (name: string) => {
    if (!user || !profile) return;
    
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Secure 6 digit join code
    const groupId = doc(collection(db, 'groups')).id; // Pre-calculate id

    const groupMember: GroupMember = {
      uid: user.uid,
      displayName: profile.displayName,
      email: profile.email,
      role: 'admin',
      score: 100,
      joinedAt: new Date().toISOString()
    };

    const newGroup: Group = {
      id: groupId,
      name,
      code,
      adminId: user.uid,
      members: [groupMember],
      inventory: [
        { id: '1', name: 'Milk Packets', quantity: 'Good', status: 'good', updatedAt: new Date().toISOString() },
        { id: '2', name: 'Maggi Noodles', quantity: 'Low', status: 'low', updatedAt: new Date().toISOString() },
        { id: '3', name: 'Water Can (20L)', quantity: 'Good', status: 'good', updatedAt: new Date().toISOString() }
      ],
      tasks: [
        { id: '1', title: 'Bring Water Can', assignedTo: [user.uid], dueDate: new Date().toISOString().split('T')[0], completed: false },
        { id: '2', title: 'Clean Gas Stove', assignedTo: [user.uid], dueDate: new Date().toISOString().split('T')[0], completed: false }
      ],
      wishlist: [],
      eventFunds: [],
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Create group document
      await setDoc(doc(db, 'groups', groupId), newGroup);
      
      // 2. Set current group id in user profile
      await updateDoc(doc(db, 'users', user.uid), {
        currentGroupId: groupId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${groupId}`);
    }
  };

  // 4. Join Group via code
  const joinGroup = async (code: string): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      const q = query(collection(db, 'groups'), where('code', '==', code.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return false;
      }

      const groupDoc = snap.docs[0];
      const groupId = groupDoc.id;
      const groupData = groupDoc.data() as Group;

      // Check if user is already a member
      const exists = groupData.members.some(m => m.uid === user.uid);
      
      if (!exists) {
        const newMember: GroupMember = {
          uid: user.uid,
          displayName: profile.displayName,
          email: profile.email,
          role: 'member',
          score: 100,
          joinedAt: new Date().toISOString()
        };

        await updateDoc(doc(db, 'groups', groupId), {
          members: arrayUnion(newMember)
        });
      }

      // Update current user's profile
      await updateDoc(doc(db, 'users', user.uid), {
        currentGroupId: groupId
      });

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'groups/join');
      return false;
    }
  };

  const resetGroup = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        currentGroupId: null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // 5. Add Expense with multiple split methods
  const addExpense = async (
    title: string, 
    amount: number, 
    category: string, 
    splitType: 'equal' | 'percentage' | 'selected',
    splits: any,
    payerId?: string,
    payerName?: string
  ) => {
    if (!user || !profile?.currentGroupId) return;

    const expenseId = doc(collection(db, `groups/${profile.currentGroupId}/expenses`)).id;

    const newExpense: Expense = {
      id: expenseId,
      title,
      amount,
      payerId: payerId || user.uid,
      payerName: payerName || profile.displayName,
      category,
      date: new Date().toISOString().split('T')[0],
      splitType,
      splits,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'groups', profile.currentGroupId, 'expenses', expenseId), newExpense);

      // Create live unread notification for all roommate friends in the splits list
      if (Array.isArray(splits)) {
        for (const split of splits) {
          if (split.uid !== user.uid && split.uid !== newExpense.payerId) {
            const notifId = doc(collection(db, 'groups', profile.currentGroupId, 'notifications')).id;
            const notif: AppNotification = {
              id: notifId,
              groupId: profile.currentGroupId,
              toUid: split.uid,
              fromName: newExpense.payerName,
              text: `You owe ${newExpense.payerName} ₹${Math.round(split.amount)} for "${title}".`,
              type: 'expense',
              createdAt: new Date().toISOString(),
              read: false
            };
            await setDoc(doc(db, 'groups', profile.currentGroupId, 'notifications', notifId), notif);
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${profile.currentGroupId}/expenses`);
    }
  };

  // 5.1 Delete Expense
  const deleteExpense = async (expenseId: string) => {
    if (!profile?.currentGroupId) return;
    try {
      await deleteDoc(doc(db, 'groups', profile.currentGroupId, 'expenses', expenseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `groups/${profile.currentGroupId}/expenses/${expenseId}`);
    }
  };

  // 6. Add Settlement Entry
  const addSettlement = async (fromId: string, fromName: string, toId: string, toName: string, amount: number, upiTxnId?: string) => {
    if (!profile?.currentGroupId) return;

    const settlementId = doc(collection(db, `groups/${profile.currentGroupId}/settlements`)).id;
    const newSettlement: Settlement = {
      id: settlementId,
      amount,
      fromId,
      fromName,
      toId,
      toName,
      date: new Date().toISOString().split('T')[0],
      status: 'settled', // Set directly to settled on mobile UPI pay checkouts for immediate UI convenience!
      upiTxnId: upiTxnId || 'UPI-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'groups', profile.currentGroupId, 'settlements', settlementId), newSettlement);
      
      // Notify settlement recipient
      if (toId !== user.uid) {
        const notifId = doc(collection(db, 'groups', profile.currentGroupId, 'notifications')).id;
        const notif: AppNotification = {
          id: notifId,
          groupId: profile.currentGroupId,
          toUid: toId,
          fromName: fromName,
          text: `${fromName} sent you ₹${Math.round(amount)} for split settlement.`,
          type: 'settlement',
          createdAt: new Date().toISOString(),
          read: false
        };
        await setDoc(doc(db, 'groups', profile.currentGroupId, 'notifications', notifId), notif);
      }

      // Boost payer's score for checking off bills
      if (user && user.uid === fromId) {
        const scoreInc = Math.min(profile.roommateScore + 5, 100);
        const streakInc = profile.streak + 1;
        await updateDoc(doc(db, 'users', user.uid), {
          roommateScore: scoreInc,
          streak: streakInc
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${profile.currentGroupId}/settlements`);
    }
  };

  const markSettlementCompleted = async (settlementId: string) => {
    if (!profile?.currentGroupId) return;
    try {
      await updateDoc(doc(db, 'groups', profile.currentGroupId, 'settlements', settlementId), {
        status: 'settled'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${profile.currentGroupId}/settlements/${settlementId}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!profile?.currentGroupId) return;
    try {
      await updateDoc(doc(db, 'groups', profile.currentGroupId, 'notifications', id), {
        read: true
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `groups/${profile.currentGroupId}/notifications/${id}`);
    }
  };

  // --- Sub-module features ---

  // Inventory
  const addInventoryItem = async (name: string, quantity: string) => {
    if (!currentGroup) return;
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      quantity,
      status: 'good',
      updatedAt: new Date().toISOString()
    };
    try {
      const items = [...currentGroup.inventory, newItem];
      await updateDoc(doc(db, 'groups', currentGroup.id), { inventory: items });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const updateInventoryStatus = async (itemId: string, status: 'good' | 'low' | 'out') => {
    if (!currentGroup) return;
    const items = currentGroup.inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, status, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { inventory: items });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    if (!currentGroup) return;
    const items = currentGroup.inventory.filter(item => item.id !== itemId);
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { inventory: items });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  // Chore Tasks
  const addChoreTask = async (title: string, assignedTo: string[], dueDate: string) => {
    if (!currentGroup) return;
    const newTask: ChoreTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      assignedTo,
      dueDate,
      completed: false
    };
    try {
      const tasks = [...currentGroup.tasks, newTask];
      await updateDoc(doc(db, 'groups', currentGroup.id), { tasks });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const toggleChoreTask = async (taskId: string) => {
    if (!currentGroup || !user) return;
    const tasks = currentGroup.tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
          completedBy: !task.completed ? user.uid : undefined
        };
      }
      return task;
    });
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { tasks });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const deleteChoreTask = async (taskId: string) => {
    if (!currentGroup) return;
    const tasks = currentGroup.tasks.filter(task => task.id !== taskId);
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { tasks });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  // Wishlist
  const addWishlistItem = async (name: string, estimatedPrice: number) => {
    if (!currentGroup || !user || !profile) return;
    const newItem: WishlistItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      estimatedPrice,
      votes: [],
      requestedBy: user.uid,
      requestedByName: profile.displayName,
      createdAt: new Date().toISOString()
    };
    try {
      const wishlist = [...(currentGroup.wishlist || []), newItem];
      await updateDoc(doc(db, 'groups', currentGroup.id), { wishlist });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const voteWishlistItem = async (itemId: string) => {
    if (!currentGroup || !user) return;
    const wishlist = (currentGroup.wishlist || []).map(item => {
      if (item.id === itemId) {
        const votes = item.votes.includes(user.uid)
          ? item.votes.filter(v => v !== user.uid)
          : [...item.votes, user.uid];
        return { ...item, votes };
      }
      return item;
    });
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { wishlist });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const deleteWishlistItem = async (itemId: string) => {
    if (!currentGroup) return;
    const wishlist = (currentGroup.wishlist || []).filter(item => item.id !== itemId);
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { wishlist });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  // Event fund tracker
  const addEventFund = async (title: string, description: string, targetAmount: number, date: string) => {
    if (!currentGroup) return;
    const newFund: EventFund = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      targetAmount,
      collectedAmount: 0,
      date,
      contributors: [],
      createdAt: new Date().toISOString()
    };
    try {
      const eventFunds = [...(currentGroup.eventFunds || []), newFund];
      await updateDoc(doc(db, 'groups', currentGroup.id), { eventFunds });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const contributeToEventFund = async (fundId: string, amount: number) => {
    if (!currentGroup || !user) return;
    const eventFunds = (currentGroup.eventFunds || []).map(fund => {
      if (fund.id === fundId) {
        const contributors = fund.contributors.includes(user.uid) 
          ? fund.contributors 
          : [...fund.contributors, user.uid];
        return {
          ...fund,
          collectedAmount: fund.collectedAmount + amount,
          contributors
        };
      }
      return fund;
    });
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { eventFunds });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const deleteEventFund = async (fundId: string) => {
    if (!currentGroup) return;
    const eventFunds = (currentGroup.eventFunds || []).filter(fund => fund.id !== fundId);
    try {
      await updateDoc(doc(db, 'groups', currentGroup.id), { eventFunds });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groups/${currentGroup.id}`);
    }
  };

  const refreshData = async () => {
    if (!user || !profile?.currentGroupId) return;
    try {
      // 1. Refresh current group
      const groupDoc = await getDoc(doc(db, 'groups', profile.currentGroupId));
      if (groupDoc.exists()) {
        setCurrentGroup({ id: groupDoc.id, ...groupDoc.data() } as Group);
      }

      // 2. Refresh expenses
      const expensesSnap = await getDocs(collection(db, 'groups', profile.currentGroupId, 'expenses'));
      const expList: Expense[] = [];
      expensesSnap.forEach(doc => {
        expList.push({ id: doc.id, ...doc.data() } as Expense);
      });
      expList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(expList);

      // 3. Refresh settlements
      const settlementsSnap = await getDocs(collection(db, 'groups', profile.currentGroupId, 'settlements'));
      const setList: Settlement[] = [];
      settlementsSnap.forEach(doc => {
        setList.push({ id: doc.id, ...doc.data() } as Settlement);
      });
      setList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSettlements(setList);

      // 4. Refresh notifications
      const notificationsSnap = await getDocs(
        query(collection(db, 'groups', profile.currentGroupId, 'notifications'), where('toUid', '==', user.uid))
      );
      const notifList: AppNotification[] = [];
      notificationsSnap.forEach(doc => {
        notifList.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifList);
    } catch (err) {
      console.error("Manual refresh data failed:", err);
      throw err;
    }
  };

  return (
    <RoomContext.Provider value={{
      currentGroup,
      expenses,
      settlements,
      notifications,
      loadingGroup,
      createGroup,
      joinGroup,
      addExpense,
      deleteExpense,
      addSettlement,
      markSettlementCompleted,
      markNotificationRead,
      addInventoryItem,
      updateInventoryStatus,
      deleteInventoryItem,
      addChoreTask,
      toggleChoreTask,
      deleteChoreTask,
      addWishlistItem,
      voteWishlistItem,
      deleteWishlistItem,
      addEventFund,
      contributeToEventFund,
      deleteEventFund,
      suggestedSettlements,
      memberBalances,
      resetGroup,
      refreshData
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
