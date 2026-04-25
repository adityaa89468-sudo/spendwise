
import React from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Utensils, 
  Bus, 
  Receipt, 
  ShoppingBag, 
  Stethoscope, 
  Film, 
  GraduationCap, 
  Wallet as WalletIcon, 
  TrendingUp, 
  RotateCcw,
  Tag
} from 'lucide-react';

interface Props {
  iconName: string;
  type?: 'income' | 'expense';
  className?: string;
}

const CategoryIcon: React.FC<Props> = ({ iconName, type, className = "w-6 h-6" }) => {
  switch (iconName) {
    case 'Utensils': return <Utensils className={className} />;
    case 'Bus': return <Bus className={className} />;
    case 'Receipt': return <Receipt className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'Stethoscope': return <Stethoscope className={className} />;
    case 'Film': return <Film className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'Wallet': return <WalletIcon className={className} />;
    case 'TrendingUp': return <TrendingUp className={className} />;
    case 'RotateCcw': return <RotateCcw className={className} />;
    default: 
      if (type === 'income') return <ArrowUpCircle className={className} />;
      if (type === 'expense') return <ArrowDownCircle className={className} />;
      return <Tag className={className} />;
  }
};

export default CategoryIcon;
