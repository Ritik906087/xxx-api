'use client';

import React, { useState } from 'react';
import { AuthPanel } from '@/components/vantage/auth-panel';
import { DashboardView } from '@/components/vantage/dashboard-view';
import { type User } from '@/lib/vantage-store';
import { Shield, Server, Zap, Globe } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  if (user) {
    return <DashboardView user={user} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Ultra-Low Latency Engine
            </div>
            <h1 className="text-5xl lg:text-7xl font-headline font-bold tracking-tighter leading-[1] text-foreground">
              Powering the next <span className="text-primary">generation</span> of institutional finance.
            </h1>
            <p className="text-lg text-muted-foreground font-body max-w-lg">
              Vantage Engine provides a high-performance serverless backend orchestrating atomic transactions, 
              AI fraud detection, and multi-region ledger integrity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-secondary rounded-lg border border-white/5 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm uppercase">Smart-Shield</h3>
                <p className="text-xs text-muted-foreground">AI-powered pattern reasoning for fraud avoidance.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-secondary rounded-lg border border-white/5 flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm uppercase">Omni-Auth</h3>
                <p className="text-xs text-muted-foreground">Supabase & OTP security for distributed access.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AuthPanel onAuthSuccess={(user) => setUser(user)} />
        </div>
      </div>
    </div>
  );
}