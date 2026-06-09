'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Server, Zap, Globe, Terminal, Activity, CheckCircle2, AlertCircle, RefreshCcw, Send, Lock, KeyRound, Loader2, Play, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { requestOTP, verifyOTP } from '@/app/actions/vantage-actions';
import { DashboardView } from '@/components/vantage/dashboard-view';

export default function ArchitectDashboard() {
  const [phone, setPhone] = useState('919060873927');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentOtp, setLastSentOtp] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const { toast } = useToast();

  // Clear stale tokens on mount for fresh session simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('vantage_session_user');
    if (savedUser) {
      setAuthenticatedUser(JSON.parse(savedUser));
    }
  }, []);

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
          description: `API: Monexo | Status: 200 OK | Sent to: ${phone}`,
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
      // 1. Internal Validation
      const verifyRes = await verifyOTP("user@example.com", otp);
      
      if (verifyRes.success) {
        // 2. Critical: Establish Identity Mapping with Backend and get naya token
        const loginRes = await fetch('/api/xxapi/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNo: phone })
        });
        
        const loginData = await loginRes.json();
        
        if (loginRes.ok && loginData.data) {
          const newToken = loginData.data;
          const userData = { ...verifyRes.user, mobileNo: phone, token: newToken };
          
          // 3. Save new token and user data
          localStorage.setItem('vantage_session_token', newToken);
          localStorage.setItem('vantage_session_user', JSON.stringify(userData));
          
          setAuthenticatedUser(userData);
          
          toast({
            title: "Session Authorized",
            description: `Token: ${newToken} | Identity Linked`,
          });
        } else {
          throw new Error("Identity Mapping Failed");
        }
      } else {
        toast({
          variant: 'destructive',
          title: "Auth Failed",
          description: verifyRes.message,
        });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Critical Auth Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (authenticatedUser) {
    return <DashboardView user={authenticatedUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-code selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xl shadow-sm">M</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-lg tracking-tight text-slate-900">Monexo Hybrid API Gateway</h1>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] uppercase animate-pulse">Live Status</Badge>
            </div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">MongoDB Atlas & Supabase Core</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-bold px-6 h-10 shadow-md shadow-blue-500/20 flex gap-2"
          >
            <Link href="/get">
              <ExternalLink className="w-4 h-4" />
              GET RESULTS
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <section className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Monexo SMS Gateway (MeraOTP.in)
          </div>
          <Card className="bg-white border-slate-200 p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Phase 1: OTP Initiation</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 919060873927"
                    className="bg-slate-50 border-slate-200 text-sm font-code h-12 pl-4 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-bold">MOBILE_NO</div>
                </div>
                <Button 
                  onClick={handleTriggerOTP}
                  disabled={isLoading}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-[10px] uppercase font-bold h-12 px-8 min-w-[200px] shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send SMS Request"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Phase 2: Validation</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Input 
                    placeholder="Enter 4-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={4}
                    className="bg-slate-50 border-slate-200 text-sm font-code h-12 pl-4 focus:border-blue-500 transition-all tracking-[0.5em]"
                  />
                  <div className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-bold uppercase">TOKEN</div>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length < 4}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-bold h-12 px-8 shadow-md shadow-blue-500/20"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate Session"}
                </Button>
              </div>
              {lastSentOtp && (
                <div className="bg-blue-50 border border-blue-100 p-2 rounded mt-2">
                  <p className="text-[10px] text-blue-600 font-bold">DEBUG_OTP_RECOVERY: {lastSentOtp}</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        <footer className="pt-8 pb-12 text-center border-t border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">
            Monexo Enterprise Backend • Optimized for High Scale
          </p>
        </footer>
      </main>
    </div>
  );
}
