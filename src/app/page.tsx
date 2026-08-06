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
  Cpu, 
  Database,
  RefreshCw,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
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
    
    try {
      // Use Relative Path for API Route to prevent CORS/Origin issues
      const res = await fetch('/api/run-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, accountType })
      });
      
      const result = await res.json();
      
      setLogs(result.logs || []);
      
      if (result.code === 200) {
        toast({ 
          title: "Protocol Success", 
          description: "Full automation sequence completed successfully." 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Sequence Halted", 
          description: result.message || "Upstream gateway error." 
        });
      }
    } catch (e: any) {
      console.error("[FRONTEND_FETCH_ERROR]:", e);
      toast({ 
        variant: 'destructive', 
        title: "Network Boundary Error", 
        description: "Could not reach the local API controller." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-code p-6 md:p-12 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 rotate-3 transition-transform hover:rotate-0">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tighter uppercase">Vantage Engine</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest">Enterprise Controller</Badge>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  Status: Operational
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Layer</p>
              <p className="text-xs font-bold text-emerald-500 uppercase">HMAC-MD5 ENFORCED</p>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <Cpu className="w-6 h-6 text-slate-700" />
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
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Target Phone</label>
                  <div className="relative group">
                    <Input 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="91XXXXXXXXXX"
                      className="bg-slate-950 border-slate-800 text-blue-400 h-16 rounded-2xl focus:ring-blue-600 font-black text-lg pl-6 transition-all group-hover:border-blue-500/50"
                    />
                    <Database className="absolute right-6 top-5 w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-slate-600 tracking-widest ml-1">Protocol Type</label>
                  <Input 
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-slate-400 h-16 rounded-2xl font-bold pl-6"
                  />
                </div>
                <Button 
                  onClick={handleRunAutomation}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-20 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all flex gap-4 shadow-xl",
                    isLoading ? "bg-slate-800 text-slate-600" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
                  )}
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  {isLoading ? "Synchronizing Flow..." : "Initiate Sequence"}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-3 text-blue-500">
                <Shield className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Proxy Integrity</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Automation utilizes a Zero-Crash backend orchestrator with deterministic signature salting and organic client pacing.
              </p>
            </div>
          </div>

          {/* Ledger / Terminal */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 rounded-[2rem] overflow-hidden h-full flex flex-col shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-4">
                  <Terminal className="w-5 h-5 text-blue-500" />
                  Live Packet Ledger
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Stream Active</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/40">
                <div ref={scrollRef} className="h-[600px] overflow-y-auto p-8 terminal-scroll font-code text-[11px]">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-6">
                      <Cpu className="w-12 h-12 opacity-10" />
                      <p className="text-[9px] uppercase font-black tracking-[0.5em]">Waiting for protocol signal...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {logs.map((log, idx) => {
                        const step = Object.keys(log)[0];
                        const data = log[step];
                        const isOk = data.code === 200 || data.code === 0 || data.status === 'ok';
                        return (
                          <div key={idx} className="border-l border-slate-800 pl-6 space-y-3 relative group">
                            <div className="absolute -left-[3.5px] top-1 w-[7px] h-[7px] rounded-full bg-slate-800 group-hover:bg-blue-500 transition-colors" />
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="text-[10px] font-black uppercase text-blue-400">{step}</span>
                              <Badge variant="outline" className={cn("text-[8px] font-black border-slate-800", isOk ? "text-emerald-500" : "text-rose-500")}>
                                {isOk ? "HTTP_200_OK" : `CODE_${data.code || 500}`}
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
                      {isLoading && (
                        <div className="flex items-center gap-4 text-blue-500 animate-pulse pl-6">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Negotiating Upstream Gateway...</span>
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
