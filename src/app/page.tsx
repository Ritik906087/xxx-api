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
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: "2", name: "MobiKwik", icon: "https://download.kspay.shop/icon/mobc.webp" },
  { id: "4", name: "Paytm", icon: "https://download.kspay.shop/icon/paytmct.png" },
  { id: "3", name: "PhonePe", icon: "https://download.kspay.shop/icon/phonepe_1.webp" },
  { id: "1", name: "FreeCharge", icon: "https://download.kspay.shop/img/freecharge.webp" },
  { id: "8", name: "Navi", icon: "https://download.keyspay.xyz/img/navi/navi_1.webp" },
  { id: "7", name: "AmazonPay", icon: "https://file.ipay.news/img/amazon/amazon.webp" },
];

const MASTER_IDENTITIES = [
  { phone: "7870873927", name: "Master 01" },
  { phone: "8431549953", name: "Master 02" },
  { phone: "9579390488", name: "Master 03" },
  { phone: "7892941854", name: "Master 04" },
  { phone: "8099636920", name: "Master 05" },
  { phone: "8792533303", name: "Master 06" },
];

export default function AutomationDashboard() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [platform, setPlatform] = useState('2');
  const [masterId, setMasterId] = useState('7870873927');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRunAutomation = async () => {
    if (!phone || phone.length < 10) {
      toast({ 
        variant: 'destructive', 
        title: "Validation Error", 
        description: "Valid 10-digit target phone is required." 
      });
      return;
    }

    setIsLoading(true);
    setLogs([]);
    setOtpSent(false);
    
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send-otp', 
          phone, 
          platform: parseInt(platform),
          masterPhone: masterId
        })
      });
      
      const result = await res.json();
      setLogs(result.logs || []);
      
      if (result.code === 200) {
        const platformName = PLATFORMS.find(p => p.id === platform)?.name || 'Platform';
        setOtpSent(true);
        toast({ 
          title: "OTP Dispatched", 
          description: `Code sent to ${phone} via ${platformName}.` 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Sequence Halted", 
          description: result.message || "Upstream gateway error." 
        });
      }
    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: "Network Boundary Error", 
        description: "Could not reach the automation controller." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({ 
        variant: 'destructive', 
        title: "Validation Error", 
        description: "Valid OTP code is required." 
      });
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
          platform: parseInt(platform), 
          otp,
          masterPhone: masterId
        })
      });
      
      const result = await res.json();
      setLogs(prev => [...prev, ...result.logs]);
      
      if (result.code === 200) {
        toast({ 
          title: "Identity Verified", 
          description: `UPI ID Extracted: ${result.upis || 'Pending'}` 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Verification Failed", 
          description: result.message || "Invalid OTP code." 
        });
      }
    } catch (e: any) {
      toast({ 
        variant: 'destructive', 
        title: "Network Boundary Error", 
        description: "Could not reach the verification controller." 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-code p-6 md:p-12 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 rotate-3 transition-transform hover:rotate-0">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tighter uppercase text-white">JCoinPay Engine</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest">Multi-Identity Mode V4</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Gateway: jcoinpay.vip
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Identity</p>
              <p className="text-xs font-bold text-blue-400 uppercase">{masterId}</p>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <Shield className="w-6 h-6 text-emerald-500/50" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Execution Nexus</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1 flex items-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    Master Identity
                  </label>
                  <Select value={masterId} onValueChange={setMasterId}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 h-14 rounded-2xl focus:ring-blue-600 font-bold">
                      <SelectValue placeholder="Select Master ID" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl">
                      {MASTER_IDENTITIES.map((id) => (
                        <SelectItem key={id.phone} value={id.phone} className="focus:bg-blue-600 focus:text-white rounded-lg cursor-pointer py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{id.name}</span>
                            <span className="text-[10px] opacity-50">{id.phone}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1 flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Target Platform
                  </label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300 h-14 rounded-2xl focus:ring-blue-600 font-bold">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl">
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="focus:bg-blue-600 focus:text-white rounded-lg cursor-pointer py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.icon} alt={p.name} className="w-5 h-5 rounded-sm object-contain" />
                            <span className="font-bold">{p.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1 flex items-center gap-2">
                    <Smartphone className="w-3 h-3" />
                    Target Phone Number
                  </label>
                  <div className="relative group">
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile"
                      className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl focus:ring-blue-600 font-black text-lg pl-6 transition-all group-hover:border-blue-500/50"
                    />
                    <Smartphone className="absolute right-6 top-5 w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                    <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest ml-1 flex items-center gap-2">
                      <KeyRound className="w-3 h-3" />
                      Verification Code (OTP)
                    </label>
                    <div className="relative group">
                      <Input 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP Received"
                        className="bg-slate-950 border-emerald-500/30 text-emerald-400 h-16 rounded-2xl focus:ring-emerald-500 font-black text-lg pl-6 transition-all group-hover:border-emerald-500/50"
                      />
                      <Zap className="absolute right-6 top-5 w-5 h-5 text-emerald-900 group-hover:text-emerald-500 transition-colors" />
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
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isLoading ? "Dispatching..." : otpSent ? "Resend OTP" : "Step 1: Get OTP"}
                  </Button>

                  {otpSent && (
                    <Button 
                      onClick={handleVerifyOtp}
                      disabled={isLoading || isVerifying}
                      className={cn(
                        "w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
                      )}
                    >
                      {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isVerifying ? "Verifying..." : "Step 2: Verify & Extract"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                <Lock className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Verification Advisory</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Automation utilizes a secure background worker to handle Login PWD {'->'} PAY token extraction {'->'} Multi-platform OTP dispatch.
              </p>
            </div>
          </div>

          {/* Ledger / Terminal */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2rem] overflow-hidden h-full flex flex-col shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-emerald-500" />
                  Live Packet Ledger
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Gateway Ready</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/40">
                <div ref={scrollRef} className="h-[600px] overflow-y-auto p-8 terminal-scroll font-code text-[11px]">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                      <Database className="w-12 h-12 opacity-10" />
                      <p className="text-[9px] uppercase font-black tracking-[0.5em]">Waiting for manual trigger...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        const isOk = data.code === "200" || data.code === 200 || data.msg === 'success';
                        return (
                          <div key={idx} className="border-l border-slate-800 pl-6 space-y-3 relative group">
                            <div className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full bg-slate-800 group-hover:bg-emerald-500 transition-colors" />
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="text-[10px] font-black uppercase text-emerald-400">{step}</span>
                              <Badge variant="outline" className={cn("text-[8px] font-black border-slate-800", isOk ? "text-emerald-500" : "text-rose-500")}>
                                {isOk ? "HTTP_200_OK" : `FAIL_${data.code || 400}`}
                              </Badge>
                            </div>
                            <div className="relative">
                              <pre className="text-slate-500 bg-slate-900/80 p-5 rounded-2xl overflow-x-auto border border-slate-800/30 terminal-scroll leading-relaxed shadow-inner max-h-48">
                                {JSON.stringify(data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                      {(isLoading || isVerifying) && (
                        <div className="flex items-center gap-4 text-emerald-500 animate-pulse pl-6">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Synchronizing Upstream Handshake...</span>
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
