
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  monthlyBudget: number;
  currency: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isCustom?: boolean;
}

export interface AppState {
  user: UserProfile | null;
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  theme: 'light' | 'dark';
}
