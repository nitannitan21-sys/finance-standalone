import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/lib/useTheme';
import {
  Wallet,
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  History,
  Target,
  SlidersHorizontal,
  LogOut,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Landmark, end: false },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, end: false },
  { to: '/month', label: 'Month', icon: CalendarDays, end: false },
  { to: '/year', label: 'Year', icon: CalendarRange, end: false },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/goals', label: 'Goals', icon: Target, end: false },
  { to: '/budget', label: 'Budget', icon: SlidersHorizontal, end: false }
];

function navClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 h-11 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  ].join(' ');
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-3 h-16 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-foreground leading-tight">Personal Finance</div>
          <div className="text-[11px] text-muted-foreground">Money in · out · saved</div>
        </div>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={navClass} onClick={onNavigate}>
            <n.icon className="w-4 h-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground mb-2"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center text-xs font-bold">
            {(user?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user?.full_name || 'Account'}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-bold text-foreground">Finance</span>
            </div>
            <button onClick={() => setMenuOpen(true)} className="p-2 text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
            <div className="w-72 bg-card h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="flex-1 bg-black/40" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col">
        <SidebarContent />
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}