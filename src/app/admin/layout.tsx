'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Settings, 
  LogOut, 
  ChevronRight,
  Shield,
  Activity,
  Terminal,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return children;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Transactions', icon: Wallet, path: '/admin/transactions' },
    { label: 'System Logs', icon: Terminal, path: '/admin/logs' },
    { label: 'Config', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-code">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-400 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-600/20">V</div>
          <div>
            <h1 className="text-white font-headline font-black text-lg tracking-tight">VANTAGE</h1>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] uppercase font-black px-2 py-0.5">Control Panel</Badge>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center justify-between px-4 h-12 rounded-xl transition-all group",
                pathname === item.path 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              {pathname === item.path && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Node Status</span>
            </div>
            <p className="text-[10px] font-bold text-white flex items-center justify-between">
              US-EAST-01 <span className="text-emerald-500">ONLINE</span>
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full justify-start gap-3 h-12 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-12 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Environment Registry</h2>
            <div className="flex items-center gap-3 mt-1">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-900">MONGODB ATLAS CLUSTER v6.1</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Current Admin</p>
              <p className="text-xs font-bold text-slate-900">root@vantage.top</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-blue-600">A</div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-12 terminal-scroll">
          {children}
        </div>
      </main>
    </div>
  );
}
