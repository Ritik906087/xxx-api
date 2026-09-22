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
  Zap, 
  Activity, 
  Smartphone, 
  CheckCircle2, 
  KeyRound, 
  ArrowRightCircle,
  SearchCode,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Database,
  Fingerprint,
  Link2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CHANNELS = [
  { id: "dt_phonepe", name: "PhonePe", type: 1, engine: "dtpay", icon: "https://download.kspay.shop/icon/phonepe_1.webp" },
  { id: "dt_paytm", name: "Paytm", type: 9, engine: "dtpay", icon: "https://picsum.photos/seed/paytm/32/32" },
  { id: "dt_mobikwik", name: "MobiKwik", type: 2, engine: "dtpay", icon: "https://picsum.photos/seed/mobi/32/32" },
  { id: "dt_freecharge", name: "Freecharge", type: 3, engine: "dtpay", icon: "https://picsum.photos/seed/fc/32/32" },
  { id: "leg_phonepe_biz", name: "PhonePeBusiness", type: 14, engine: "legacy", icon: "https://picsum.photos/seed/ppb/32/32" },
  { id: "leg_paytm_biz", name: "PaytmBusiness", type: 9, engine: "legacy", icon: "https://picsum.photos/seed/ptmb/32/32" },
  { id: "leg_navi", name: "Navi", type: 13, engine: "legacy", icon: "https://download.keyspay.xyz/img/navi/navi_1.webp" },
  { id: "leg_supermoney", name: "SuperMoney", type: 17, engine: "legacy", icon: "https://picsum.photos/seed/sm/32/32" },
  { id: "leg_bharatpe_biz", name: "BharatPeBusiness", type: 18, engine: "legacy", icon: "https://picsum.photos/seed/bp/32/32" },
];

export default function AutomationDashboard() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('dt_phonepe');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [vpaList, setVpaList] = useState<any[]>([]);
  const [tokenUsed, setTokenUsed] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [checkingTokenId, setCheckingTokenId] = useState<string | null>(null);
  
  // New Resolver State
  const [resolvePhone, setResolvePhone] = useState('');
  const [foundMapping, setFoundMapping] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/token-health');
      const data = await res.json();
      if (data && data.data) {
        setHealthData(data.data.tokens || []);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Health Registry Unavailable" });
    }
  };

  const handleCheckIndividualToken = async (tokenString: string) => {
    setCheckingTokenId(tokenString);
    try {
      const res = await fetch(`/api/admin/token-health?checkToken=${tokenString}`);
      const data = await res.json();
      const liveStatus = data?.data?.status || "404 Error";
      
      setHealthData(prev => prev.map(tk => {
        if (tk.id === tokenString) return { ...tk, status: liveStatus };
        return tk;
      }));

      toast({ title: "Live Token Test Complete", description: `Token Status: ${liveStatus}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Fault" });
    } finally {
      setCheckingTokenId(null);
    }
  };

  const handleFindMapping = async () => {
    if (!resolvePhone || resolvePhone.length < 10) {
      toast({ variant: 'destructive', title: "Identity Required", description: "Enter 10-digit number to find linked token." });
      return;
    }
    setIsResolving(true);
    setFoundMapping(null);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find-token-mapping', phone: resolvePhone })
      });
      const result = await res.json();
      if (result.code === 200) {
        setFoundMapping(result);
        toast({ title: "Identity Linked", description: `Number is mapped to ${result.type}` });
      } else {
        toast({ variant: 'destructive', title: "No Link Found", description: result.message });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Resolver Fault" });
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

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
    setTokenUsed(null);
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
      if (result.logs) setLogs(result.logs);
      
      if (result.code === 200) {
        setOtpSent(true);
        setSessionId(result.sessionId);
        setTokenUsed(result.tokenUsed);
        toast({ title: "OTP Sequence Initiated", description: result.message });
      } else {
        toast({ variant: 'destructive', title: "Execution Halted", description: result.message || "Upstream Error" });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
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
        toast({ title: "Verification Successful", description: `${result.vpaList?.length || 0} accounts extracted.` });
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
    if (!phone || phone.length < 10) {
      toast({ variant: 'destructive', title: "Required", description: "Enter 10-digit number for ledger scan." });
      return;
    }
    setIsLoading(true);
    setVpaList([]);
    setLogs([]);
    setTokenUsed(null);
    try {
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-by-phone', phone, channelType: activeChannel?.type })
      });
      const result = await res.json();
      setTokenUsed(result.tokenUsed);
      if (result.logs) setLogs(result.logs);
      
      if (result.code === 200) {
        setVpaList(result.vpaList || []);
        toast({ title: "Ledger Scan Complete", description: result.message });
      } else {
        toast({ variant: 'destructive', title: "Scan Halted", description: result.message });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "System Fault" });
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
              <h1 className="text-3xl font-headline font-black tracking-tighter uppercase">Vantage Hybrid v2.0</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] tracking-widest px-3">LOAD_BALANCER_L4_ACTIVE</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                  <Activity className="w-3 h-3 text-emerald-500" /> STICKY_SESSION: ACTIVE
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Request Token</p>
                <p className="text-xs font-bold text-emerald-500 truncate max-w-[220px]">{tokenUsed || 'POOL_ROTATING_BALANCER'}</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Select Channel</label>
                  <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 h-14 rounded-2xl font-bold focus:ring-blue-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={c.icon} alt={c.name} className="w-5 h-5 rounded-sm" />
                            <span className="font-bold">{c.name}</span>
                            <Badge variant="outline" className="text-[7px] border-slate-700 ml-auto uppercase">{c.engine}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Identity (Phone)</label>
                  <div className="relative">
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="10-digit number" 
                      className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl font-black text-lg pl-6 focus:ring-blue-600" 
                    />
                    <Smartphone className="absolute right-6 top-5 w-5 h-5 text-slate-700" />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-black text-emerald-500 tracking-widest ml-1">Security Code (OTP)</label>
                    <div className="relative">
                      <Input 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="Enter Code" 
                        className="bg-slate-950 border-emerald-500/30 text-emerald-400 h-16 rounded-2xl font-black text-lg pl-6 focus:ring-emerald-600" 
                      />
                      <KeyRound className="absolute right-6 top-5 w-5 h-5 text-emerald-900" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!otpSent ? (
                    <div className="grid grid-cols-1 gap-4">
                      <Button 
                        onClick={handleRunAutomation} 
                        disabled={isLoading} 
                        className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[12px] tracking-widest shadow-xl shadow-blue-600/20"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                          <div className="flex items-center gap-3">
                            <ArrowRightCircle className="w-5 h-5" />
                            Trigger OTP Flow
                          </div>
                        )}
                      </Button>
                      
                      {activeChannel?.engine === 'dtpay' && (
                        <Button 
                          onClick={handleHistoryCheck} 
                          disabled={isLoading} 
                          variant="outline"
                          className="h-16 rounded-2xl border-slate-800 bg-slate-950 hover:bg-slate-900 font-black uppercase text-[10px] tracking-widest text-emerald-500 flex gap-3 shadow-lg shadow-emerald-500/5"
                        >
                          <SearchCode className="w-4 h-4" />
                          Scan Direct History
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={handleVerifyOtp} 
                      disabled={isVerifying} 
                      className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs shadow-xl shadow-emerald-600/20 flex gap-3"
                    >
                      {isVerifying ? <Loader2 className="animate-spin" /> : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Verify & Extract Ledger
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Identity Resolver Card */}
            <Card className="bg-slate-900/50 border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden border-t-4 border-t-amber-600">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                   <Fingerprint className="w-6 h-6 text-amber-500" />
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-100">Identity Resolver</h3>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Find DTPay Token Mapping</p>
                   </div>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Input 
                      value={resolvePhone} 
                      onChange={(e) => setResolvePhone(e.target.value)} 
                      placeholder="Find number linkage" 
                      className="bg-slate-950 border-slate-800 text-amber-400 h-14 rounded-xl font-bold text-sm pl-6" 
                    />
                    <Button 
                      onClick={handleFindMapping} 
                      disabled={isResolving}
                      className="absolute right-2 top-2 h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4"
                    >
                      {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {foundMapping && (
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-600/20 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Assigned Slot:</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black uppercase text-[9px]">
                        {foundMapping.type}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Linked Token:</span>
                      <code className="text-[10px] text-emerald-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                        {foundMapping.token}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Token Health Monitor UI */}
            <Card className="bg-slate-900/50 border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-900 flex justify-between flex-row items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-4">
                  <Database className="w-4 h-4 text-blue-500" /> DTPay Pool Load health
                </CardTitle>
                <Button onClick={fetchHealth} variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-800">
                  <RefreshCw className="w-3 h-3 text-slate-500" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto terminal-scroll">
                <div className="space-y-2">
                  {healthData.map((tk, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between transition-all hover:border-slate-700">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-300 tracking-wider font-mono">{tk.shortId}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{tk.engine}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[8px] font-black px-2 py-0.5 ${
                          tk.status === '200 OK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          tk.status === '404 Error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {tk.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleCheckIndividualToken(tk.id)} 
                          disabled={checkingTokenId !== null}
                          className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95"
                        >
                          {checkingTokenId === tk.id ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : "Check"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Telemetry/Ledger Panel */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-slate-950/50 border-slate-800 rounded-[2rem] overflow-hidden h-[380px] flex flex-col shadow-2xl">
              <CardHeader className="p-6 border-b border-slate-900 flex justify-between flex-row items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-blue-500" /> Active System Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div ref={scrollRef} className="h-full overflow-y-auto p-6 terminal-scroll text-[11px] font-code">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20 italic">
                      [System Listening - Run Actions or Scan Ledger to Stream Response Packet]
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        return (
                          <div key={idx} className="border-l border-slate-800 pl-4 relative">
                            <div className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] bg-blue-500 rounded-full" />
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-blue-400 font-black uppercase tracking-wider text-[10px]">{step}</span>
                            </div>
                            <pre className="text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto terminal-scroll text-[10px]">
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

            {/* Ledger Results */}
            <Card className="bg-slate-950/50 border-slate-800 rounded-[2rem] overflow-hidden flex-1 shadow-2xl">
              <CardHeader className="p-6 border-b border-slate-900 flex justify-between flex-row items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Filtered Extracted Ledger Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {vpaList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vpaList.map((v, i) => (
                      <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-emerald-500/50 transition-all">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white font-mono">{v.vpa}</span>
                          <span className="text-[8px] text-slate-500 uppercase mt-1 font-bold tracking-widest">
                            VPA: {v.upiAccount} | {v.provider}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5">{v.status || 'Success'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-700 font-black uppercase text-xs flex flex-col items-center gap-3">
                    <AlertCircle className="w-6 h-6 opacity-20" />
                    No Active Ledger Entries Found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
