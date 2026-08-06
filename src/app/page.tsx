
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Terminal, Shield, Zap } from 'lucide-react';
import { runAutomation } from '@/app/actions/vantage-actions';
import { useToast } from '@/hooks/use-toast';

export default function AutomationDashboard() {
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const { toast } = useToast();

  const handleRunAutomation = async () => {
    if (!phone) {
      toast({ variant: 'destructive', title: "Error", description: "Target phone is required" });
      return;
    }

    setIsLoading(true);
    setLogs([]);
    
    try {
      const result = await runAutomation(phone, accountType);
      setLogs(result.logs || []);
      
      if (result.code === 200) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ variant: 'destructive', title: "Automation Failed", description: result.message });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Critical Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-code p-6 md:p-12 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/20">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black tracking-tight">VANTAGE AUTOMATION</h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-1">RS-WALLET MULTI-STEP ENGINE v3.0</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 text-[10px] uppercase font-black">System Ready</Badge>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Target Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Target Phone</label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9060873927"
                    className="bg-slate-950 border-slate-800 text-blue-400 h-14 rounded-2xl focus:ring-blue-600 focus:border-blue-600 transition-all font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Account Type</label>
                  <Input 
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    placeholder="1"
                    className="bg-slate-950 border-slate-800 text-slate-400 h-14 rounded-2xl"
                  />
                </div>
                <Button 
                  onClick={handleRunAutomation}
                  disabled={isLoading}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex gap-3"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  Execute Automation
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-4 text-emerald-500 mb-4">
                <Shield className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Security Protocol</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                MD5 Signatures are automatically generated for each packet. Session keys are derived from real-time bot login responses.
              </p>
            </Card>
          </div>

          {/* Logs */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-900 border-slate-800 rounded-[2.5rem] overflow-hidden h-full flex flex-col shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-blue-500" />
                  Execution Ledger
                </CardTitle>
                {isLoading && <Badge className="bg-blue-600 animate-pulse text-[8px]">Processing Step {logs.length + 1}...</Badge>}
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-950/50">
                <div className="h-[600px] overflow-y-auto p-8 terminal-scroll font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                      <Terminal className="w-12 h-12 opacity-20" />
                      <p className="text-[10px] uppercase font-black tracking-widest">Waiting for execution command...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {logs.map((log, idx) => {
                        const stepName = Object.keys(log)[0];
                        const stepData = log[stepName];
                        return (
                          <div key={idx} className="border-l-2 border-blue-600/30 pl-6 py-2 group hover:border-blue-500 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black text-blue-500">STEP_{idx + 1}</span>
                              <span className="text-[10px] font-black uppercase text-slate-300">{stepName}</span>
                              <Badge variant="outline" className={`text-[8px] border-slate-800 ${stepData.code === 200 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                STATUS_{stepData.code}
                              </Badge>
                            </div>
                            <pre className="text-[12px] text-slate-500 bg-slate-900/50 p-4 rounded-xl overflow-x-auto border border-slate-800/50">
                              {JSON.stringify(stepData, null, 2)}
                            </pre>
                          </div>
                        );
                      })}
                      {isLoading && (
                        <div className="flex items-center gap-3 text-blue-500 animate-pulse pl-6">
                          <span className="text-xs">_</span>
                          <span className="text-[10px] font-black uppercase">Sequencing next packet...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="text-center pt-8 border-t border-slate-900">
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">Institutional Data Bypass Protocol • Secure Node US-EAST</p>
        </footer>
      </div>
    </div>
  );
}
