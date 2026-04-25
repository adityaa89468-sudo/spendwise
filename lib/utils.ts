
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currency: string = 'INR') {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(0).replace(/[0-9.,]/g, '').trim();
}
