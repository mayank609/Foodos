'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Search' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/history', label: 'History' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍜</span>
          <span className="text-lg font-bold text-slate-900">Foodos</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                pathname === link.href
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-slate-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <AuthButton />
      </div>
    </nav>
  );
}
