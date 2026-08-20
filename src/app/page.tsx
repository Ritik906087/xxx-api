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
  Cpu, 
  Database,
  RefreshCw,
  Activity,
  History,
  Lock,
  Smartphone,
  Wallet,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Globe,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CHANNELS = [
  // NEW DTPay Server Platforms
  { id: "dt_paytm", name: "Paytm (DTPay)", type: 9, accountType: "1", engine: "dtpay", icon: "https://download.kspay.shop/icon/paytmct.png" },
  { id: "dt_mobikwik", name: "MobiKwik (DTPay)", type: 2, accountType: "1", engine: "dtpay", icon: "https://download.kspay.shop/icon/mobc.webp" },
  { id: "dt_freecharge", name: "Freecharge (DTPay)", type: 3, accountType: "2", engine: "dtpay", icon: "https://download.kspay.shop/img/freecharge.webp" },
  { id: "dt_amazon", name: "Amazon Pay (DTPay)", type: 1, accountType: "1", engine: "dtpay", icon: "https://picsum.photos/seed/amazon/32/32" },
  
  // LEGACY RSWallet Platforms
  { id: "leg_phonepe", name: "PhonePe", type: 1, accountType: "1", engine: "legacy", icon: "https://download.kspay.shop/icon/phonepe_1.webp" },
  { id: "leg_navi", name: "Navi", type: 13, accountType: "1", engine: "legacy", icon: "https://download.keyspay.xyz/img/navi/navi_1.webp" },
  { id: "leg_paytm_biz", name: "Paytm Business", type: 16, accountType: "1", engine: "legacy", icon: "https://download.kspay.shop/icon/paytmct.png" },
  { id: "leg_supermoney", name: "SuperMoney", type: 17, accountType: "1", engine: "legacy", icon: "https://picsum.photos/seed/sm/32/32" },
  { id: "leg_bharatpe", name: "BharatPe Business", type: 18, accountType: "1", engine: "legacy", icon: "https://picsum.photos/seed/bp/32/32" },
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
      toast({ variant: 'destructive', title: "Validation Error", description: "Valid 10-digit phone is required." });
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
          accountType: activeChannel?.accountType,
          engine: activeChannel?.engine
        })
      });
      
      const result = await res.json();
      setLogs(result.logs || []);
      
      if (result.code === 200) {
        setOtpSent(true);
        setSessionId(result.sessionId);
        toast({ title: "OTP Dispatched", description: `Sequence started for ${activeChannel?.name}.` });
      } else {
        toast({ variant: 'destructive', title: "Execution Halted", description: result.message || "Upstream Error" });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "System Fault", description: "Network connection lost." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({ variant: 'destructive', title: "Validation Error", description: "OTP is too short." });
      return;
    }

    setIsVerifying(true);
    
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify-otp', 
          phone, 
          otp,
          sessionId
        })
      });
      
      const result = await res.json();
      setLogs(prev => [...prev, ...result.logs]);
      
      if (result.code === 200) {
        setVpaList(result.vpaList || []);
        toast({ title: "Identity Verified", description: `${result.vpaList?.length || 0} VPAs extracted.` });
      } else {
        toast({ variant: 'destructive', title: "Verification Failed", description: result.message || "Invalid OTP" });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "System Fault", description: "Network connection lost." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-code p-6 md:p-12 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 rotate-3 transition-transform hover:rotate-0">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tighter uppercase text-white">Vantage Expert Automation</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest">Multi-Server Orchestrator v4.0</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  DTPay & RSWallet: Ready
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6 text-blue-500/50" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Automation Controls</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Channel</label>
                  <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 h-14 rounded-2xl focus:ring-blue-600 font-bold">
                      <SelectValue placeholder="Select App" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl">
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="focus:bg-blue-600 focus:text-white rounded-lg cursor-pointer py-3">
                          <div className="flex items-center gap-3">
                            <img src={c.icon} alt={c.name} className="w-5 h-5 rounded-sm object-contain" />
                            <span className="font-bold">{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Mobile</label>
                  <div className="relative group">
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10 digit number"
                      className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl focus:ring-blue-600 font-black text-lg pl-6"
                    />
                    <Smartphone className="absolute right-6 top-5 w-5 h-5 text-slate-700" />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-in slide-in-from-top-4">
                    <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest ml-1">Received OTP</label>
                    <div className="relative group">
                      <Input 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6 digit OTP"
                        className="bg-slate-950 border-emerald-500/30 text-emerald-400 h-16 rounded-2xl focus:ring-emerald-500 font-black text-lg pl-6"
                      />
                      <KeyRound className="absolute right-6 top-5 w-5 h-5 text-emerald-900" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    onClick={handleRunAutomation}
                    disabled={isLoading || isVerifying}
                    className={cn(
                      "w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl",
                      isLoading ? "bg-slate-800 text-slate-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
                    )}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isLoading ? "Automating..." : otpSent ? "Resend Trigger" : "Trigger Automation"}
                  </Button>

                  {otpSent && (
                    <Button 
                      onClick={handleVerifyOtp}
                      disabled={isLoading || isVerifying}
                      className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
                    >
                      {isVerifying ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isVerifying ? "Verifying..." : "Verify & Extract VPAs"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {vpaList.length > 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-3xl p-6 space-y-4 border animate-in zoom-in-95">
                <div className="flex items-center gap-3 text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Extracted VPA Profiles</span>
                </div>
                <div className="space-y-2">
                  {vpaList.map((v, i) => (
                    <div key={i} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black text-white">{v.vpa || v.upiAccount}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] px-2">{v.status || v.provider || 'Active'}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden h-full flex flex-col shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-blue-500" />
                  Real-time Execution Ledger
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Multi-Cloud Bridge</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/40">
                <div ref={scrollRef} className="h-[650px] overflow-y-auto p-8 terminal-scroll font-code text-[11px]">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                      <Database className="w-12 h-12 opacity-10" />
                      <p className="text-[9px] uppercase font-black tracking-[0.5em]">System Standby: Hybrid Link Established</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        const isOk = String(data.code) === "200" || String(data.code) === "0" || data.success === true || data.ok === true;
                        return (
                          <div key={idx} className="border-l border-slate-800 pl-6 space-y-3 relative">
                            <div className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full bg-slate-800" />
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="text-[10px] font-black uppercase text-blue-400">{step}</span>
                              <Badge variant="outline" className={cn("text-[8px] font-black border-slate-800", isOk ? "text-emerald-500" : "text-rose-500")}>
                                {isOk ? "SUCCESS" : `FAULT_${data.code || 400}`}
                              </Badge>
                            </div>
                            <pre className="text-slate-500 bg-slate-900/80 p-5 rounded-2xl overflow-x-auto border border-slate-800/30 terminal-scroll max-h-56">
                              {JSON.stringify(data, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                      {(isLoading || isVerifying) && (
                        <div className="flex items-center gap-4 text-blue-500 animate-pulse pl-6">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Executing Protocol across Multi-Server Bridge...</span>
                        </div>
                      )}
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

