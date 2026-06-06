'use client';

import React, { useState } from 'react';
import { Shield, Server, Zap, Globe, Terminal, Activity, CheckCircle2, AlertCircle, RefreshCcw, Send, Lock, KeyRound, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { requestOTP, verifyOTP } from '@/app/actions/vantage-actions';

export default function ArchitectDashboard() {
  const [phone, setPhone] = useState('919060873927');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTriggerOTP = async () => {
    if (!phone) {
      toast({ variant: 'destructive', title: "Error", description: "Mobile number is required" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await requestOTP(phone);
      if (res.success) {
        setLastSentOtp(res.dev_otp || null);
        toast({
          title: "OTP Sent Successfully",
          description: `API: MeraOTP | Status: 200 OK | Sent to: ${phone}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: "SMS Gateway Error",
          description: res.message,
        });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Network Error", description: "Could not connect to SMS route" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsLoading(true);
    try {
      const res = await verifyOTP("user@example.com", otp);
      if (res.success) {
        toast({
          title: "Session Authorized",
          description: "Supabase JWT issued | Access Granted",
        });
      } else {
        toast({
          variant: 'destructive',
          title: "Auth Failed",
          description: res.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-code selection:bg-primary selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f59e0b] rounded flex items-center justify-center font-bold text-black text-xl">CF</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-lg tracking-tight">Cloudflare Workers REST API</h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase animate-pulse">Live Gateway</Badge>
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">MongoDB Atlas & Supabase Integration</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Deployment Target</p>
            <p className="text-xs font-semibold text-primary">Cloudflare Workers Isolate</p>
          </div>
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-[10px] uppercase font-bold px-4">Fullscreen</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Active Integration Specs */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 ml-1">Active Supabase Integration Specs</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0f172a] border-slate-800 p-4 relative group hover:border-primary/50 transition-all">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">SB_PROJECT_URL</span>
                <span className="text-sm font-code text-blue-400 truncate">https://slytlppadlmnnloszuwd.supabase.co</span>
              </div>
            </Card>
            <Card className="bg-[#0f172a] border-slate-800 p-4 relative group hover:border-primary/50 transition-all">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">SB_PUBLISHABLE_KEY</span>
                <span className="text-sm font-code text-amber-400 truncate">sb_publishable_b17Qw8jmbfhisK4E69BbxQ__9KZwKX</span>
              </div>
            </Card>
          </div>
        </section>

        {/* System Connections */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">System Connections</div>
            <Button variant="ghost" size="sm" className="text-[10px] text-primary uppercase font-bold h-6 gap-2">
              <RefreshCcw className="w-3 h-3" /> Refresh
            </Button>
          </div>
          
          <Card className="bg-[#0f172a] border-slate-800 divide-y divide-slate-800 overflow-hidden">
            <div className="p-6 flex items-center justify-between group hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div>
                  <h3 className="text-sm font-bold">MongoDB Atlas Status</h3>
                  <p className="text-[11px] text-slate-500">Connected to <span className="text-emerald-400">Atlas Cluster</span>. DB: <span className="text-slate-300 italic">TDM</span></p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-6 flex items-center justify-between group hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <div>
                  <h3 className="text-sm font-bold">Supabase Secure JWT</h3>
                  <p className="text-[11px] text-slate-500">Supabase JWT Configured. <span className="text-slate-300">Active JWT decoding activated.</span></p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </Card>
        </section>

        {/* OTP Auth Engine */}
        <section className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Phone SMS OTP Auth Engine (via MeraOTP.in)
          </div>
          <Card className="bg-[#0f172a] border-slate-800 p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Step 1: Get SMS Passcode</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 919060873927"
                    className="bg-[#020617] border-slate-800 text-sm font-code h-12 pl-4 focus:border-primary transition-all"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-600 font-bold">MOBILE_NO</div>
                </div>
                <Button 
                  onClick={handleTriggerOTP}
                  disabled={isLoading}
                  className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-[10px] uppercase font-bold h-12 px-8 min-w-[200px]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Trigger OTP SMS Route"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Step 2: Sign In Verification</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input 
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="bg-[#020617] border-slate-800 text-sm font-code h-12 pl-4 focus:border-primary transition-all tracking-[0.5em]"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-600 font-bold uppercase">OTP_CODE</div>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length < 6}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 border-none hover:opacity-90 text-[10px] uppercase font-bold h-12 px-8"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign In Session"}
                </Button>
              </div>
              {lastSentOtp && (
                <p className="text-[10px] text-emerald-500 mt-2">Dev Hint: Last OTP sent was {lastSentOtp}</p>
              )}
            </div>
          </Card>
        </section>

        {/* How To Deploy */}
        <section className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">How To Deploy</div>
          <Card className="bg-[#020617] border-slate-800 p-6 overflow-hidden">
            <div className="font-code text-[12px] leading-loose text-slate-400">
              <p className="text-slate-500 mb-2"># Deploy this backend code directly to Cloudflare Edge Nodes worldwide with standard keys:</p>
              <div className="space-y-1">
                <p><span className="text-slate-600"># 1. Install wrangler CLI</span></p>
                <p><span className="text-emerald-500">npm i -g wrangler</span></p>
                <p className="mt-2"><span className="text-slate-600"># 2. Run local development</span></p>
                <p><span className="text-emerald-500">npx wrangler dev src/worker.ts</span></p>
                <p className="mt-2"><span className="text-slate-600"># 3. Add Atlas / Supabase bindings</span></p>
                <p><span className="text-emerald-500">npx wrangler secret put MONGODB_URI</span></p>
                <p><span className="text-emerald-500">npx wrangler secret put SUPABASE_JWT_SECRET</span></p>
                <p className="mt-2"><span className="text-slate-600"># 4. Deploy to worldwide edge servers</span></p>
                <p><span className="text-emerald-500">npx wrangler deploy src/worker.ts</span></p>
              </div>
            </div>
          </Card>
        </section>

        {/* Interactive REST Playground */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Interactive REST Playground</div>
            <div className="text-[10px] text-slate-600 font-bold uppercase">Connected to Cloud Atlas</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
            <Card className="bg-[#0f172a] border-slate-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">Endpoint Routing</div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {[
                  { method: 'GET', path: '/api/health', desc: 'Status', color: 'text-blue-400' },
                  { method: 'POST', path: '/api/auth/send-otp', desc: 'OTP SMS', color: 'text-emerald-400' },
                  { method: 'POST', path: '/api/auth/verify-otp', desc: 'Verify', color: 'text-amber-400' },
                  { method: 'GET', path: '/api/items', desc: 'Items', color: 'text-purple-400' },
                ].map((route, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-900 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold w-12 ${route.color}`}>{route.method}</span>
                      <span className="text-xs font-code">{route.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">{route.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="bg-[#0f172a] border-slate-800 flex flex-col p-6 space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Request Parameters</div>
                <div className="flex items-center justify-between p-3 bg-[#020617] border border-slate-800 rounded">
                  <span className="text-[11px] text-slate-400 italic">Authorization Header Status:</span>
                  <span className="text-[10px] text-rose-400 font-bold uppercase">None Included</span>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-[10px] uppercase font-bold h-12 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                Execute Endpoint
              </Button>
            </Card>
          </div>
        </section>

        {/* Footer info */}
        <footer className="pt-8 pb-12 text-center">
          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.3em]">
            This app was developed by Ritik. Enterprise Backend Security Enabled.
          </p>
        </footer>
      </main>
    </div>
  );
}
