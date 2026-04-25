
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Category, TransactionType } from '../types';

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'Utensils' },
  { id: '2', name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'Bus' },
  { id: '3', name: 'Bills', type: 'expense', color: '#f59e0b', icon: 'Receipt' },
  { id: '4', name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'ShoppingBag' },
  { id: '5', name: 'Health', type: 'expense', color: '#10b981', icon: 'Stethoscope' },
  { id: '6', name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'Film' },
  { id: '7', name: 'Education', type: 'expense', color: '#06b6d4', icon: 'GraduationCap' },
  { id: '8', name: 'Salary', type: 'income', color: '#10b981', icon: 'Wallet' },
  { id: '9', name: 'Investments', type: 'income', color: '#6366f1', icon: 'TrendingUp' },
  { id: '10', name: 'Refund', type: 'income', color: '#3b82f6', icon: 'RotateCcw' },
  { id: '11', name: 'Other', type: 'expense', color: '#71717a', icon: 'Tag' },
];

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories(INITIAL_CATEGORIES);
      setLoading(false);
      return;
    }

    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const q = query(categoriesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customCats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isCustom: true
      })) as Category[];

      setCategories([...INITIAL_CATEGORIES, ...customCats]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCategory = async (name: string, type: TransactionType, color: string = '#6366f1') => {
    if (!user) return;
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    await addDoc(categoriesRef, {
      name,
      type,
      color,
      icon: 'Tag',
      createdAt: new Date().toISOString()
    });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user) return;
    const categoryRef = doc(db, 'users', user.uid, 'categories', categoryId);
    await deleteDoc(categoryRef);
  };

  return { categories, loading, addCategory, deleteCategory };
};
