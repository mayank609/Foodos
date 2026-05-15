import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function platformColor(slug: string): string {
  const colors: Record<string, string> = {
    swiggy: 'bg-orange-500 text-white',
    zomato: 'bg-red-500 text-white',
    restaurant: 'bg-emerald-600 text-white',
  };
  return colors[slug] ?? 'bg-gray-600 text-white';
}

export function platformTextColor(slug: string): string {
  const colors: Record<string, string> = {
    swiggy: 'text-orange-600',
    zomato: 'text-red-600',
    restaurant: 'text-emerald-600',
  };
  return colors[slug] ?? 'text-gray-600';
}

export function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}
