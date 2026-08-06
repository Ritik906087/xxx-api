
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Play, 
  Terminal, 
  Shield, 
  Zap, 
  Activity, 
  Cpu, 
  Database,
  RefreshCw,
  Lock
} from 'lucide-react';
import { runAutomation } from '@/app/actions/vantage-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AutomationDashboard() {
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRunAutomation = async () => {
    if (!phone) {
      toast({ variant: 'destructive', title: "Validation Error", description: "Target phone identity is required." });
      return;
    }

    setIsLoading(true);
    setLogs([]);
    
    try {
      const result = await runAutomation(phone, accountType);
      setLogs(result.logs || []);
      
      if (result.code === 200) {
        toast({ title: "Sequence Successful", description: "All packets dispatched successfully." });
      } else {
        toast({ variant: 'destructive', title: "Sequence Aborted", description: result.message });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Internal Engine Fault", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-code p-6 md:p-12 selection:bg-blue-600/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Infrastructure */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 rotate-3">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tighter uppercase">Vantage Automation</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest">v3.4.0 Stable</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Cpu className="w-3 h-3" />
                  Node: US-EAST-01
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Protocol</p>
              <p className="text-xs font-bold text-emerald-500 uppercase">AES-256 + MD5 Signed</p>
            </div>
            <div className="h-12 w-px bg-slate-800" />
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-6 py-3 text-[10px] uppercase font-black">
              System Ready
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Controller Panel */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl border-t-blue-500/20">
              <CardHeader className="p-10 border-b border-slate-800">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Execution Parameters</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Identity (Phone)</label>
                  <div className="relative group">
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 919060873927"
                      className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl focus:ring-blue-600 focus:border-blue-600 transition-all font-black text-lg pl-6 group-focus-within:border-blue-600/50"
                    />
                    <Database className="absolute right-6 top-5 w-5 h-5 text-slate-700 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Account Class</label>
                  <div className="relative">
                    <Input 
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      placeholder="1"
                      className="bg-slate-950 border-slate-800 text-slate-400 h-16 rounded-2xl font-bold pl-6"
                    />
                    <Badge variant="outline" className="absolute right-4 top-5 border-slate-800 text-[8px] uppercase font-black">Default</Badge>
                  </div>
                </div>
                <Button 
                  onClick={handleRunAutomation}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-20 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex gap-4",
                    isLoading ? "bg-slate-800 text-slate-500" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                  )}
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-4 h-4 fill-current" />}
                  {isLoading ? "Synchronizing Engine..." : "Initiate Protocol"}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] p-10 space-y-6">
              <div className="flex items-center gap-4 text-emerald-500">
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Protection</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                Encryption Layer: <span className="text-slate-300">RFC-1321 (MD5)</span><br/>
                Header Spoofing: <span className="text-slate-300">Enabled</span><br/>
                Throttle Mode: <span className="text-slate-300">Randomized (2-3s)</span>
              </p>
              <div className="h-px bg-slate-800" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-600 uppercase">System Integrity</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase">Optimal</span>
              </div>
            </div>
          </div>

          {/* Execution Terminal */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2.5rem] overflow-hidden h-full flex flex-col shadow-2xl border-t-emerald-500/10">
              <CardHeader className="p-10 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-blue-500" />
                  Automated Sequence Ledger
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-blue-600 animate-pulse" : "bg-slate-800")} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{isLoading ? "Streaming Traffic" : "Ready"}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/40">
                <div ref={scrollRef} className="h-[650px] overflow-y-auto p-10 terminal-scroll font-code text-sm">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                      <Activity className="w-16 h-16 opacity-10 animate-pulse" />
                      <p className="text-[10px] uppercase font-black tracking-[0.5em]">Waiting for execution trigger...</p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {logs.map((log, idx) => {
                        const stepName = Object.keys(log)[0];
                        const stepData = log[stepName];
                        const isSuccess = stepData.code === 200 || stepData.code === 0;
                        return (
                          <div key={idx} className="border-l-2 border-slate-800 pl-10 py-2 group hover:border-blue-600 transition-all relative">
                            <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-slate-800 group-hover:bg-blue-600 transition-all" />
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-[10px] font-black text-slate-600 tracking-tighter">PKT_{String(idx + 1).padStart(3, '0')}</span>
                              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{stepName}</span>
                              <Badge variant="outline" className={cn(
                                "text-[9px] border-slate-800 font-black",
                                isSuccess ? 'text-emerald-500' : 'text-rose-500'
                              )}>
                                HTTP_{stepData.code || 200}
                              </Badge>
                            </div>
                            <pre className="text-[12px] text-slate-500 bg-slate-900/80 p-6 rounded-3xl overflow-x-auto border border-slate-800/50 shadow-inner terminal-scroll leading-relaxed">
                              {JSON.stringify(stepData, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                      {isLoading && (
                        <div className="flex items-center gap-6 text-blue-500 animate-pulse pl-10">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sequencing Next Packet Cluster...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="text-center pt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.5em]">Vantage Institutional Bypass Engine • Secure Link Alpha</p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase">DB: Mapped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-600 uppercase">Auth: HMAC-MD5</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
