'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Play, 
  Terminal, 
  Shield, 
  Zap, 
  Activity, 
  Smartphone, 
  CheckCircle2, 
  KeyRound, 
  UserCheck, 
  History, 
  Search,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// HYBRID CHANNELS: DTPay + Legacy RSWallet
const CHANNELS = [
  // DTPay Engine
  { id: "dt_paytm", name: "Paytm", type: 9, engine: "dtpay", icon: "https://picsum.photos/seed/paytm/32/32" },
  { id: "dt_mobikwik", name: "MobiKwik", type: 2, engine: "dtpay", icon: "https://picsum.photos/seed/mobi/32/32" },
  { id: "dt_freecharge", name: "Freecharge", type: 3, engine: "dtpay", icon: "https://picsum.photos/seed/fc/32/32" },
  { id: "dt_amazon", name: "Amazon Pay", type: 33, engine: "dtpay", icon: "https://picsum.photos/seed/amz/32/32" },
  // Legacy Engine (RSWallet)
  { id: "leg_phonepe", name: "PhonePe", type: 1, engine: "legacy", icon: "https://download.kspay.shop/icon/phonepe_1.webp" },
  { id: "leg_navi", name: "Navi", type: 13, engine: "legacy", icon: "https://download.keyspay.xyz/img/navi/navi_1.webp" },
  { id: "leg_phonepe_biz", name: "PhonePeBusiness", type: 14, engine: "legacy", icon: "https://picsum.photos/seed/ppb/32/32" },
  { id: "leg_paytm_biz", name: "PaytmBusiness", type: 16, engine: "legacy", icon: "https://picsum.photos/seed/paytmb/32/32" },
  { id: "leg_supermoney", name: "SuperMoney", type: 17, engine: "legacy", icon: "https://picsum.photos/seed/sm/32/32" },
  { id: "leg_bharatpe_biz", name: "BharatPeBusiness", type: 18, engine: "legacy", icon: "https://picsum.photos/seed/bp/32/32" },
];

export default function AutomationDashboard() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('dt_paytm');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [vpaList, setVpaList] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const activeChannel = CHANNELS.find(c => c.id === selectedChannelId);

  const handleRunAutomation = async () => {
    if (!phone || phone.length < 10) {
      toast({ variant: 'destructive', title: "Validation Error", description: "10-digit phone required." });
      return;
    }
    setIsLoading(true);
    setLogs([]);
    setVpaList([]);
    setOtpSent(false);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send-otp', 
          phone, 
          channelType: activeChannel?.type,
          engine: activeChannel?.engine
        })
      });
      const result = await res.json();
      setLogs(result.logs || []);
      if (result.code === 200) {
        setOtpSent(true);
        setSessionId(result.sessionId);
        toast({ title: "OTP Dispatched", description: `Session ${result.sessionId} active.` });
      } else {
        toast({ variant: 'destructive', title: "Execution Halted", description: result.message || "Error" });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', otp, sessionId })
      });
      const result = await res.json();
      if (result.logs) setLogs(prev => [...prev, ...result.logs]);
      if (result.code === 200) {
        setVpaList(result.vpaList || []);
        toast({ title: "Verified", description: `${result.vpaList?.length || 0} VPAs found.` });
      } else {
        toast({ variant: 'destructive', title: "Verification Failed", description: result.message });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleHistoryCheck = async () => {
    if (!phone) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-by-phone', phone, channelType: activeChannel?.type })
      });
      const result = await res.json();
      setVpaList(result.vpaList || []);
      setLogs(result.logs || []);
      toast({ title: "Audit Complete", description: "Direct Ledger Scan finished." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-code p-6 selection:bg-blue-600">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-slate-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 rotate-3">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black tracking-tighter uppercase">Hybrid Vantage Engine</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] tracking-widest px-3">POOL_SYSTEM_ACTIVE</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                  <Activity className="w-3 h-3 text-emerald-500" /> STATUS: OPTIMIZED
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 rounded-[2rem] shadow-2xl">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Select Channel</label>
                  <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 h-14 rounded-2xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={c.icon} alt={c.name} className="w-5 h-5 rounded-sm" />
                            <span className="font-bold">{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Identity (Phone)</label>
                  <div className="relative">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl font-black text-lg pl-6" />
                    <Smartphone className="absolute right-6 top-5 w-5 h-5 text-slate-700" />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest ml-1">Protocol Code (OTP)</label>
                    <div className="relative">
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter Code" className="bg-slate-950 border-emerald-500/30 text-emerald-400 h-16 rounded-2xl font-black text-lg pl-6" />
                      <KeyRound className="absolute right-6 top-5 w-5 h-5 text-emerald-900" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!otpSent ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleRunAutomation} disabled={isLoading} className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Trigger OTP"}
                      </Button>
                      <Button 
                        onClick={handleHistoryCheck} 
                        disabled={isLoading || activeChannel?.engine !== 'dtpay'} 
                        variant="outline"
                        className="h-16 rounded-2xl border-slate-800 bg-slate-950 hover:bg-slate-900 font-black uppercase text-[10px] tracking-widest text-slate-400"
                      >
                        Scan Ledger
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleVerifyOtp} disabled={isVerifying} className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs">
                      {isVerifying ? <Loader2 className="animate-spin" /> : "Verify & Settle"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {vpaList.length > 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-3xl p-6 border animate-in zoom-in-95">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Extracted Profiles</span>
                </div>
                <div className="space-y-2">
                  {vpaList.map((v, i) => (
                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex justify-between">
                      <span className="text-xs font-black text-white">{v.vpa}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px]">{v.status || 'Active'}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="bg-slate-950/50 border-slate-800 rounded-[2rem] overflow-hidden h-[750px] flex flex-col shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-900 flex justify-between flex-row items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-blue-500" /> Hybrid Telemetry Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div ref={scrollRef} className="h-full overflow-y-auto p-8 terminal-scroll text-[11px] font-code">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20 italic">
                      [Waiting for Protocol Initiation...]
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        return (
                          <div key={idx} className="border-l border-slate-800 pl-6 relative">
                            <div className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] bg-slate-800 rounded-full" />
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-blue-400 font-black uppercase">{step}</span>
                            </div>
                            <pre className="text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto">
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
