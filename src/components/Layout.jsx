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
  Moon,
  X
} from 'lucide-react';

const NAV = [
  {
    to: '/',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true
  },
  {
    to: '/accounts',
    label: 'Accounts',
    icon: Landmark,
    end: false
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    end: false
  },
  {
    to: '/month',
    label: 'Month',
    icon: CalendarDays,
    end: false
  },
  {
    to: '/year',
    label: 'Year',
    icon: CalendarRange,
    end: false
  },
  {
    to: '/history',
    label: 'History',
    icon: History,
    end: false
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: Target,
    end: false
  },
  {
    to: '/budget',
    label: 'Budget',
    icon: SlidersHorizontal,
    end: false
  }
];

function navClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 h-11 rounded-xl',
    'text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  ].join(' ');
}

function Brand({ mobile = false }) {
  return (
    <div
      className={`flex items-center gap-3 ${
        mobile ? '' : 'px-3'
      }`}
    >
      <div
        className={[
          mobile
            ? 'w-9 h-9 rounded-xl'
            : 'w-10 h-10 rounded-xl',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center shadow-sm'
        ].join(' ')}
      >
        <Wallet className="w-5 h-5" />
      </div>

      <div className="min-w-0">
        <div className="font-extrabold tracking-tight text-foreground leading-tight">
          SFinance
        </div>

        {!mobile && (
          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            Money made simple
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  showClose = false
}) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="h-20 shrink-0 px-3 flex items-center justify-between border-b border-border/70">
        <Brand />

        {showClose && (
          <button
            onClick={onNavigate}
            className="
              w-10 h-10
              rounded-xl
              flex items-center justify-center
              text-muted-foreground
              hover:bg-accent
              hover:text-foreground
              transition-colors
            "
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">

        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Menu
        </div>

        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={navClass}
            onClick={onNavigate}
          >
            <n.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{n.label}</span>
          </NavLink>
        ))}

      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t border-border/70">

        {/* Theme */}
        <button
          onClick={toggle}
          className="
            w-full
            flex items-center gap-3
            px-3 h-10
            rounded-xl
            text-sm text-muted-foreground
            hover:bg-accent
            hover:text-foreground
            transition-colors
            mb-3
          "
        >
          {dark ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}

          <span>
            {dark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-xl bg-muted/50">

          <div className="
            w-9 h-9
            rounded-full
            bg-primary/15
            text-primary
            flex items-center justify-center
            text-sm font-bold
            shrink-0
          ">
            {(user?.full_name || user?.email || 'U')
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {user?.full_name || 'Account'}
            </div>

            <div className="text-[11px] text-muted-foreground truncate">
              {user?.email}
            </div>
          </div>

        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="
            w-full
            flex items-center gap-3
            px-3 h-10
            rounded-xl
            text-sm text-muted-foreground
            hover:bg-accent
            hover:text-foreground
            transition-colors
          "
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sign out</span>
        </button>

      </div>
    </div>
  );
}

function OceanBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >

      {/* Soft ocean glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 12% 18%,
              rgba(56, 189, 248, 0.10),
              transparent 30%
            ),
            radial-gradient(
              circle at 88% 25%,
              rgba(14, 165, 233, 0.07),
              transparent 28%
            )
          `
        }}
      />

      {/* TOP WAVES */}
      <svg
        className="absolute top-0 left-0 w-full h-[32%]"
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
      >

        <path
          d="
            M0 105
            C180 35 360 45 540 105
            C720 165 900 175 1080 100
            C1240 35 1350 50 1440 85
            L1440 0
            L0 0
            Z
          "
          fill="rgba(14, 165, 233, 0.06)"
        />

        <path
          d="
            M0 150
            C180 75 360 90 540 155
            C720 220 900 225 1080 145
            C1240 75 1350 95 1440 125
            L1440 0
            L0 0
            Z
          "
          fill="rgba(56, 189, 248, 0.07)"
        />

        <path
          d="
            M0 155
            C180 80 360 95 540 160
            C720 225 900 230 1080 150
            C1240 80 1350 100 1440 130
          "
          fill="none"
          stroke="rgba(125, 211, 252, 0.13)"
          strokeWidth="2"
        />

      </svg>

      {/* BOTTOM WAVES */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[46%]"
        viewBox="0 0 1440 520"
        preserveAspectRatio="none"
      >

        <path
          d="
            M0 230
            C180 100 360 125 540 225
            C720 325 900 335 1080 215
            C1240 110 1350 135 1440 195
            L1440 520
            L0 520
            Z
          "
          fill="rgba(14, 165, 233, 0.13)"
        />

        <path
          d="
            M0 300
            C170 190 350 200 540 290
            C730 380 900 390 1090 275
            C1240 185 1350 200 1440 250
            L1440 520
            L0 520
            Z
          "
          fill="rgba(56, 189, 248, 0.10)"
        />

        <path
          d="
            M0 390
            C200 315 380 330 590 395
            C790 460 970 450 1160 365
            C1280 315 1370 325 1440 355
            L1440 520
            L0 520
            Z
          "
          fill="rgba(34, 211, 238, 0.08)"
        />

        <path
          d="
            M0 275
            C180 155 360 175 540 265
            C720 355 900 365 1080 250
            C1240 145 1350 165 1440 220
          "
          fill="none"
          stroke="rgba(125, 211, 252, 0.16)"
          strokeWidth="3"
        />

      </svg>
    </div>
  );
}

export default function Layout() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  /* =========================
     MOBILE
     ========================= */
  if (isMobile) {
    return (
      <div className="relative min-h-[100dvh] bg-background overflow-x-hidden">

        {/* Mobile ocean background */}
        <OceanBackground />

        {/* Mobile header */}
        <header
          className="
            sticky top-0
            z-30
            bg-card/90
            backdrop-blur-xl
            border-b border-border/70
          "
        >
          <div className="flex items-center justify-between h-16 px-4">

            <Brand mobile />

            <button
              onClick={() => setMenuOpen(true)}
              className="
                w-10 h-10
                rounded-xl
                flex items-center justify-center
                text-foreground
                bg-muted/50
                hover:bg-accent
                transition-colors
              "
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>
        </header>

        {/* Mobile content */}
        <main
          className="
            relative
            z-10
            px-3
            py-4
            sm:px-4
            sm:py-5
            pb-8
          "
        >
          <Outlet />
        </main>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              bg-black/45
              backdrop-blur-[2px]
            "
            onClick={() => setMenuOpen(false)}
          >

            {/* Menu panel */}
            <div
              className="
                relative
                w-[min(19rem,88vw)]
                h-full
                bg-card
                shadow-2xl
                border-r
                border-border/70
              "
              onClick={(e) => e.stopPropagation()}
            >

              <SidebarContent
                onNavigate={() => setMenuOpen(false)}
                showClose
              />

            </div>

            {/* Tap outside to close */}
            <div className="flex-1" />

          </div>
        )}
      </div>
    );
  }

  /* =========================
     DESKTOP
     ========================= */
  return (
    <div className="relative h-screen flex bg-background">

      <OceanBackground />

      {/* Desktop sidebar */}
      <aside
        className="
          relative
          z-10
          w-64
          shrink-0
          bg-card/95
          border-r border-border/70
          flex flex-col
        "
      >
        <SidebarContent />
      </aside>

      {/* Desktop content */}
      <main
        className="
          relative
          z-10
          flex-1
          overflow-auto
        "
      >
        <Outlet />
      </main>

    </div>
  );
}