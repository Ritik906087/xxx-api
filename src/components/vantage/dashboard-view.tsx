'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VantageTerminal } from './terminal';
import { MOCK_WALLETS, MOCK_TRANSACTIONS, type Transaction, type User } from '@/lib/vantage-store';
import { processTransaction } from '@/app/actions/vantage-actions';
import { Wallet, ArrowUpRight, ArrowDownLeft, ShieldAlert, History, Globe, Settings, User as UserIcon, Copy, Check, Terminal, ExternalLink, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ApiLog {
  id: string;
  method: string;
  endpoint: string;
  status: 'success' | 'failed';
  timestamp: string;
  response: any;
}

export function DashboardView({ user }: { user: User }) {
  const [balance, setBalance] = useState(MOCK_WALLETS.find(w => w.userId === user.id)?.balance ?? 0);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([
    {
      id: 'log_1',
      method: 'GET',
      endpoint: '/api/xxapi/userinfo',
      status: 'success',
      timestamp: new Date().toISOString(),
      response: { success: true, data: { mobileNo: user.mobileNo, role: user.role } }
    }
  ]);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const addApiLog = (method: string, endpoint: string, status: 'success' | 'failed', response: any) => {
    const newLog: ApiLog = {
      id: `log_${Math.random().toString(36).substr(2, 5)}`,
      method,
      endpoint,
      status,
      timestamp: new Date().toISOString(),
      response
    };
    setApiLogs(prev => [newLog, ...prev]);
  };

  const handleCopyJson = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    toast({ title: "Copied!", description: "JSON response copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestTransaction = async (amount: number, type: 'purchase' | 'deposit' | 'withdrawal') => {
    setIsProcessing(true);
    const endpoint = '/app/actions/processTransaction';
    
    try {
      const res = await processTransaction({
        userId: user.id,
        amount,
        type,
        description: `Testing ${type} pattern`
      });
      setIsProcessing(false);

      if (res.success) {
        addApiLog('POST', endpoint, 'success', res);
        if (res.transaction.isFraudulent) {
          toast({
            variant: 'destructive',
            title: 'Smart-Shield Alert',
            description: `AI Flagged this transaction: ${res.fraudDetection?.reasoning}`
          });
        } else {
          setTransactions(prev => [res.transaction, ...prev]);
          setBalance(prev => type === 'deposit' ? prev + amount : prev - amount);
          toast({ title: 'Transaction Successful', description: 'Atomic ledger updated.' });
        }
      } else {
        addApiLog('POST', endpoint, 'failed', res);
      }
    } catch (e: any) {
      setIsProcessing(false);
      addApiLog('POST', endpoint, 'failed', { error: e.message });
      toast({ variant: 'destructive', title: 'System Error', description: 'API call failed.' });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f59e0b] rounded flex items-center justify-center font-headline font-bold text-lg text-black">V</div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight">VANTAGE ENGINE</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hybrid Logic Core</span>
          </div>
          <Badge variant="outline" className="ml-2 border-primary/20 text-primary bg-primary/5 text-[9px] uppercase font-bold animate-pulse">V2.4.0-LIVE</Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Prominent BLUE GET Button */}
          <Button 
            onClick={() => setActiveTab('logs')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase px-6 h-10 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all animate-in zoom-in-95 duration-300 gap-2"
          >
            <Play className="w-3 h-3 fill-current" />
            GET RESULTS
          </Button>

          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-code text-slate-300">{user.mobileNo}</span>
            <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[9px] uppercase">{user.role}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-12 max-w-[1600px] mx-auto w-full">
        {/* Left Stats Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto terminal-scroll pr-2">
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5" />
                Live Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-headline font-bold tracking-tight text-white mb-1">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-code text-emerald-400/80 uppercase">MongoDB Atlas Sync OK</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-2">
            <CardHeader className="pb-3 pt-3">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Action Gateways</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 p-2">
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12 border-slate-800 bg-slate-900 hover:bg-emerald-500/10 hover:border-emerald-500/30 group transition-all"
                onClick={() => handleTestTransaction(250.00, 'deposit')}
                disabled={isProcessing}
              >
                <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight">Deposit Ingress</p>
                  <p className="text-[9px] text-slate-500">Atomic Local Update</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12 border-slate-800 bg-slate-900 hover:bg-primary/10 hover:border-primary/30 group transition-all"
                onClick={() => handleTestTransaction(1200.00, 'purchase')}
                disabled={isProcessing}
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight">Execute Order</p>
                  <p className="text-[9px] text-slate-500">Blockchain Sync Logic</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-3 h-12 border-slate-800 bg-slate-900 hover:bg-rose-500/10 hover:border-rose-500/30 group transition-all"
                onClick={() => handleTestTransaction(50000.00, 'withdrawal')}
                disabled={isProcessing}
              >
                <div className="w-8 h-8 rounded bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight">High Risk Withdrawal</p>
                  <p className="text-[9px] text-slate-500">Triggers AI Fraud Check</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Inspector Column */}
        <div className="col-span-12 lg:col-span-6 flex flex-col h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1">
              <TabsList className="bg-slate-900 border border-slate-800 p-1 h-10">
                <TabsTrigger value="transactions" className="gap-2 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-slate-800">
                  <History className="w-3.5 h-3.5" />
                  Ledger
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Globe className="w-3.5 h-3.5" />
                  GET (RECORDS)
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-slate-800">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Security
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">API Mode:</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5 text-[9px] uppercase">Proxy Active</Badge>
              </div>
            </div>
            
            <TabsContent value="transactions" className="flex-1 overflow-hidden m-0">
              <div className="bg-slate-900/40 rounded-xl border border-slate-800 h-full overflow-y-auto terminal-scroll">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-800">
                    <tr>
                      <th className="p-4 font-headline uppercase tracking-widest text-slate-500 text-[9px] font-bold">Trace ID</th>
                      <th className="p-4 font-headline uppercase tracking-widest text-slate-500 text-[9px] font-bold">Operation</th>
                      <th className="p-4 font-headline uppercase tracking-widest text-slate-500 text-[9px] font-bold text-right">Magnitude</th>
                      <th className="p-4 font-headline uppercase tracking-widest text-slate-500 text-[9px] font-bold">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4 font-code text-slate-400">{tx.id}</td>
                        <td className="p-4">
                           <Badge variant="outline" className="text-[9px] uppercase border-slate-800 text-slate-300">{tx.type}</Badge>
                        </td>
                        <td className={`p-4 font-code font-bold text-right ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          {tx.isFraudulent ? (
                            <div className="flex items-center gap-1.5 text-rose-400">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Blocked</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Settled</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 overflow-hidden m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-slate-900/40 rounded-xl border border-slate-800 h-full flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-slate-400">Request Inspector</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setApiLogs([])} className="h-6 text-[9px] uppercase font-bold text-rose-400 hover:bg-rose-500/10">Purge Logs</Button>
                </div>
                <div className="flex-1 overflow-y-auto terminal-scroll divide-y divide-slate-800/30">
                  {apiLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <Globe className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">No active requests captured</p>
                    </div>
                  ) : (
                    apiLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-8 rounded-full ${log.status === 'success' ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-[9px] uppercase ${log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {log.method}
                              </Badge>
                              <p className="text-xs font-code text-slate-300 truncate max-w-[180px]">{log.endpoint}</p>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()} · SECURE PROXY</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {log.status === 'success' ? (
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 text-[9px]">200 OK</Badge>
                          ) : (
                            <Badge variant="outline" className="border-rose-500/20 text-rose-400 bg-rose-500/5 text-[9px]">ERROR</Badge>
                          )}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="audit" className="flex-1 overflow-hidden m-0">
              <div className="p-12 border border-slate-800 bg-slate-900/30 rounded-xl text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10">
                  <ShieldAlert className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-headline font-bold text-white mb-2">Omni-Shield Active</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed uppercase tracking-tight font-bold">Monitoring all cross-server proxy requests. Identity verified via Supabase JWT.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Terminal Column */}
        <div className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden">
          <VantageTerminal />
        </div>
      </main>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-[#020617] border-slate-800 text-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 font-headline text-lg">
                <Globe className="w-5 h-5 text-blue-500" />
                Packet Inspection
              </DialogTitle>
              <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-400 text-[9px] uppercase">JSON Response</Badge>
            </div>
            <DialogDescription className="text-slate-500 font-code text-xs mt-2 uppercase tracking-tighter">
              {selectedLog?.method} {selectedLog?.endpoint}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">API Payload</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCopyJson(selectedLog?.response)}
                className="h-8 gap-2 bg-slate-900 border-slate-800 hover:bg-slate-800 text-[10px] uppercase font-bold px-4"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
            </div>
            <div className="bg-[#010409] p-4 rounded-xl border border-slate-800 shadow-inner relative group">
              <pre className="text-[12px] font-code terminal-scroll max-h-[450px] overflow-auto text-blue-400/90 leading-relaxed scrollbar-thin">
                {JSON.stringify(selectedLog?.response, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
