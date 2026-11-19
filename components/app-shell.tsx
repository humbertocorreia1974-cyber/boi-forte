'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, Warehouse, Beef, Boxes, Sprout, HeartPulse, Wallet,
  Baby, FileText, Bell, ShieldCheck, Activity, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/fazendas', label: 'Fazendas', icon: Warehouse },
  { href: '/animais', label: 'Animais', icon: Beef },
  { href: '/lotes', label: 'Lotes', icon: Boxes },
  { href: '/piquetes', label: 'Piquetes', icon: Sprout },
  { href: '/sanidade', label: 'Sanidade', icon: HeartPulse },
  { href: '/reproducao', label: 'Reprodução', icon: Baby },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
  { href: '/status', label: 'Status', icon: Activity },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  if (isAuth) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md p-2 text-fg-muted transition-all duration-150 hover:bg-white/5 md:hidden"
              aria-label="Menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg font-bold">B</span>
              <span className="font-semibold tracking-tight">Boi Forte</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session?.user ? (
              <>
                <span className="hidden text-fg-muted sm:inline">{session.user.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-fg-muted transition-all duration-150 hover:bg-white/5"
                >
                  <LogOut size={14} /> Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-brand px-3 py-1.5 text-brand-fg transition-all duration-150 hover:opacity-90"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-border bg-surface/95 p-4 backdrop-blur-sm transition-transform duration-150 md:static md:z-auto md:block md:translate-x-0 md:rounded-lg md:border md:bg-surface/70',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <nav className="mt-14 space-y-1 md:mt-0">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150',
                    active
                      ? 'bg-brand/10 text-brand'
                      : 'text-fg-muted hover:bg-white/5 hover:text-fg',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
