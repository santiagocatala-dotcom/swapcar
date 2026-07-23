'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, User, Compass, Sun, Moon } from 'lucide-react';
import { useSupabase } from './SupabaseProvider';

const navItems = [
  { href: '/swipe', label: 'Explorar', icon: Compass },
  { href: '/matches', label: 'Matches', icon: Flame },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useSupabase();

  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/'
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-100 dark:bg-[rgba(15,15,35,0.9)] dark:border-gray-700">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
                isActive
                  ? 'text-black dark:text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-6 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {theme === 'dark' ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
          <span className="text-[10px] font-medium">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
        </button>
      </div>
    </nav>
  );
}
