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
  ArrowRight,
  ChevronRight,
  Info,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const CHANNELS = [
  { id: "dt_paytm", name: "Paytm (DTPay)", type: 9, accountType: "1", engine: "dtpay", icon: "https://download.kspay.shop/icon/paytmct.png" },
  { id: "dt_mobikwik", name: "MobiKwik (DTPay)", type: 2, accountType: "1", engine: "dtpay", icon: "https://download.kspay.shop/icon/mobc.webp" },
  { id: "dt_freecharge", name: "Freecharge (DTPay)", type: 3, accountType: "2", engine: "dtpay", icon: "https://download.kspay.shop/img/freecharge.webp" },
  { id: "dt_amazon", name: "Amazon Pay (DTPay)", type: 1, accountType: "1", engine: "dtpay", icon: "https://picsum.photos/seed/amazon/32/32" },
  { id: "leg_phonepe", name: "PhonePe", type: 1, accountType: "1", engine: "legacy", icon: "https://download.kspay.shop/icon/phonepe_1.webp" },
  { id: "leg_navi", name: "Navi", type: 13, accountType: "1", engine: "legacy", icon: "https://download.keyspay.xyz/img/navi/navi_1.webp" },
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
  const [billList, setBillList] = useState<any[]>([]);
  const [showBills, setShowBills] = useState(false);
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
    } catch (e) {
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
        body: JSON.stringify({ action: 'verify-otp', phone, otp, sessionId })
      });
      const result = await res.json();
      setLogs(prev => [...prev, ...result.logs]);
      if (result.code === 200) {
        setVpaList(result.vpaList || []);
        toast({ title: "Identity Verified", description: `${result.vpaList?.length || 0} VPAs extracted.` });
      } else {
        toast({ variant: 'destructive', title: "Verification Failed", description: result.message || "Invalid OTP" });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault", description: "Network connection lost." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFetchDetails = async (runnerUpiId: number) => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-upi-details', sessionId, runnerUpiId })
      });
      const result = await res.json();
      setLogs(prev => [...prev, ...result.logs]);
      if (result.code === 200) {
        setBillList(result.data?.recentBills || []);
        setShowBills(true);
        toast({ title: "Bills Captured", description: "Ledger updated with recent history." });
      } else {
        toast({ variant: 'destructive', title: "Fetch Failed", description: result.message });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault", description: "Failed to fetch bills." });
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
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest">DTPay Master Mode</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Master Session: ONLINE
                </div>
              </div>
            </div>
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
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter 10 digit number" className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl focus:ring-blue-600 font-black text-lg pl-6" />
                    <Smartphone className="absolute right-6 top-5 w-5 h-5 text-slate-700" />
                  </div>
                </div>
                {otpSent && (
                  <div className="space-y-3 animate-in slide-in-from-top-4">
                    <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest ml-1">Received OTP</label>
                    <div className="relative group">
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6 digit OTP" className="bg-slate-950 border-emerald-500/30 text-emerald-400 h-16 rounded-2xl focus:ring-emerald-500 font-black text-lg pl-6" />
                      <KeyRound className="absolute right-6 top-5 w-5 h-5 text-emerald-900" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                  <Button onClick={handleRunAutomation} disabled={isLoading || isVerifying} className={cn("w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl", isLoading ? "bg-slate-800 text-slate-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95")}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isLoading ? "Automating..." : "Trigger Automation"}
                  </Button>
                  {otpSent && (
                    <Button onClick={handleVerifyOtp} disabled={isLoading || isVerifying} className="w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95">
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
                    <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white">{v.upiAccount || v.vpa}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] px-2 w-fit mt-1">{v.provider || 'Active'}</Badge>
                      </div>
                      {v.runnerUpiId && (
                        <Button 
                          onClick={() => handleFetchDetails(v.runnerUpiId)}
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-400 hover:bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      )}
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
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/40">
                <div ref={scrollRef} className="h-[650px] overflow-y-auto p-8 terminal-scroll font-code text-[11px]">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                      <Database className="w-12 h-12 opacity-10" />
                      <p className="text-[9px] uppercase font-black tracking-[0.5em]">System Standby: DTPay Bridge Ready</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        const isOk = data.ok === true || data.code === 200 || data.code === 0;
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showBills} onOpenChange={setShowBills}>
        <DialogContent className="max-w-4xl bg-[#0f172a] text-slate-50 border-slate-800 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                <History className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-headline font-black uppercase tracking-tight">Recent Ledger History</DialogTitle>
                <DialogDescription className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Live from DTPay Automation Runner</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[500px] p-8">
            <div className="space-y-4">
              {billList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-700">
                  <Database className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No recent transactions found</p>
                </div>
              ) : (
                billList.map((bill, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        bill.billType === 'PAYIN' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {bill.billType === 'PAYIN' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-tight">{bill.billType} | {bill.billStatus}</p>
                        <p className="text-[10px] font-bold text-slate-500">UTR: {bill.utr}</p>
                        <p className="text-[9px] text-slate-600 uppercase font-bold">{bill.receivedTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xl font-headline font-black",
                        bill.billType === 'PAYIN' ? "text-emerald-500" : "text-white"
                      )}>
                        {bill.billType === 'PAYIN' ? '+' : '-'}{parseFloat(bill.amount).toFixed(2)}
                      </p>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{bill.provider}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
