export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roommateScore: number;
  streak: number;
  currentGroupId?: string;
  avatarUrl?: string;
  upiId?: string; // UPI ID for generating easy payment QR codes (e.g. upi@okaxis)
  createdAt: string;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'member';
  score: number;
  joinedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  status: 'good' | 'low' | 'out';
  updatedAt: string;
}

export interface ChoreTask {
  id: string;
  title: string;
  assignedTo: string[]; // uids of assigned roommates
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  estimatedPrice: number;
  votes: string[]; // list of uids of voters
  requestedBy: string;
  requestedByName: string;
  createdAt: string;
}

export interface EventFund {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  collectedAmount: number;
  date: string;
  contributors: string[]; // list of uids who pledged/paid
  createdAt: string;
}

export interface AppNotification {
  id: string;
  groupId: string;
  toUid: string;
  fromName: string;
  text: string;
  type: 'expense' | 'settlement' | 'room';
  createdAt: string;
  read: boolean;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: GroupMember[];
  inventory: InventoryItem[];
  tasks: ChoreTask[];
  wishlist: WishlistItem[];
  eventFunds: EventFund[];
  createdAt: string;
}

export interface ExpenseSplit {
  uid: string;
  displayName: string;
  amount: number;
  share?: number; // percentage or custom share quantity
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  payerName: string;
  category: string;
  date: string;
  splitType: 'equal' | 'percentage' | 'selected';
  splits: ExpenseSplit[]; // list of splits detailing how much each owes
  receiptUrl?: string; // uploaded proof url
  createdAt: string;
}

export interface Settlement {
  id: string;
  amount: number;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  date: string;
  status: 'pending' | 'settled';
  proofUrl?: string; // payment screenshot mock
  upiTxnId?: string; // UPI txn ref number
  createdAt: string;
}

declare global {
  interface ImportMeta {
    readonly env: Record<string, string | undefined>;
  }
}
