'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VantageTerminal } from './terminal';
import { MOCK_WALLETS, MOCK_TRANSACTIONS, type Transaction, type User } from '@/lib/vantage-store';
import { processTransaction } from '@/app/actions/vantage-actions';
import { Wallet, ArrowUpRight, ArrowDownLeft, ShieldAlert, History, Globe, Settings, User as UserIcon, Copy, Check, Terminal, ExternalLink, Play } from 'lucide-react';
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-lg flex items-center justify-between px-8 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-headline font-black text-xl text-white shadow-md">V</div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xl tracking-tight text-slate-900">VANTAGE ENGINE</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Hybrid Core Gateway</span>
          </div>
          <Badge variant="outline" className="ml-4 border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[10px] uppercase font-bold px-3 py-1">V2.4-STABLE</Badge>
        </div>
        
        <div className="flex items-center gap-6">
          <Button 
            onClick={() => setActiveTab('logs')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase px-8 h-12 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex gap-3"
          >
            <Play className="w-4 h-4 fill-current" />
            GET RESULTS
          </Button>

          <div className="hidden xl:flex items-center gap-4 px-5 py-2 bg-slate-100 rounded-xl border border-slate-200">
            <UserIcon className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-code text-slate-700 font-bold">{user.mobileNo}</span>
            <Badge className="bg-blue-100 text-blue-600 border-blue-200 text-[9px] uppercase font-black">{user.role}</Badge>
          </div>
          
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-12 max-w-[1700px] mx-auto w-full">
        {/* Left Stats Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto terminal-scroll pr-2">
          <Card className="bg-white border-slate-200 overflow-hidden relative group border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5" />
                Live Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-headline font-bold tracking-tight text-slate-900 mb-1">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                <span className="text-[10px] font-code text-emerald-600 font-bold uppercase">MongoDB Cloud Sync: OK</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 p-2 shadow-sm">
            <CardHeader className="pb-3 pt-3">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Transaction Nodes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 p-2">
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-14 border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 group transition-all"
                onClick={() => handleTestTransaction(250.00, 'deposit')}
                disabled={isProcessing}
              >
                <div className="w-9 h-9 rounded bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight text-slate-900">Deposit Node</p>
                  <p className="text-[9px] text-slate-500 font-bold">MONGODB ATLAS TARGET</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-14 border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 group transition-all"
                onClick={() => handleTestTransaction(1200.00, 'purchase')}
                disabled={isProcessing}
              >
                <div className="w-9 h-9 rounded bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
                  <ArrowUpRight className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight text-slate-900">Order Execution</p>
                  <p className="text-[9px] text-slate-500 font-bold">BLOCKCHAIN SYNC ENABLED</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-14 border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 group transition-all"
                onClick={() => handleTestTransaction(50000.00, 'withdrawal')}
                disabled={isProcessing}
              >
                <div className="w-9 h-9 rounded bg-rose-100 flex items-center justify-center group-hover:bg-rose-200">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-tight text-slate-900">High Risk Flow</p>
                  <p className="text-[9px] text-slate-500 font-bold">GENKIT AI FRAUD CHECK</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Inspector Column */}
        <div className="col-span-12 lg:col-span-6 flex flex-col h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-1">
              <TabsList className="bg-slate-100 border border-slate-200 p-1 h-12">
                <TabsTrigger value="transactions" className="gap-2 text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <History className="w-4 h-4" />
                  Master Ledger
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow-md">
                  <Globe className="w-4 h-4" />
                  GET (REALTIME)
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2 text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ShieldAlert className="w-4 h-4" />
                  Security Audit
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">PROXY ENGINE:</span>
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[9px] uppercase font-bold animate-pulse">Stealth Active</Badge>
              </div>
            </div>
            
            <TabsContent value="transactions" className="flex-1 overflow-hidden m-0">
              <div className="bg-white rounded-2xl border border-slate-200 h-full overflow-y-auto terminal-scroll shadow-sm">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xl z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-5 font-headline uppercase tracking-[0.2em] text-slate-500 text-[10px] font-black">Trace ID</th>
                      <th className="p-5 font-headline uppercase tracking-[0.2em] text-slate-500 text-[10px] font-black">Gateway</th>
                      <th className="p-5 font-headline uppercase tracking-[0.2em] text-slate-500 text-[10px] font-black text-right">Magnitude</th>
                      <th className="p-5 font-headline uppercase tracking-[0.2em] text-slate-500 text-[10px] font-black">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-all group">
                        <td className="p-5 font-code text-slate-600 font-medium">{tx.id}</td>
                        <td className="p-5">
                           <Badge variant="outline" className="text-[10px] uppercase border-slate-200 bg-white text-slate-700 font-bold">{tx.type}</Badge>
                        </td>
                        <td className={`p-5 font-code font-black text-right text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-5">
                          {tx.isFraudulent ? (
                            <div className="flex items-center gap-2 text-rose-600">
                              <ShieldAlert className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Flagged</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <Check className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
              <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-headline font-black uppercase tracking-[0.2em] text-slate-900">Live Request Inspector</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setApiLogs([])} className="h-7 text-[10px] uppercase font-black text-rose-600 hover:bg-rose-50 transition-colors">Wipe Records</Button>
                </div>
                <div className="flex-1 overflow-y-auto terminal-scroll divide-y divide-slate-100">
                  {apiLogs.length === 0 ? (
                    <div className="p-20 text-center">
                      <Globe className="w-14 h-14 text-slate-200 mx-auto mb-4 animate-pulse" />
                      <p className="text-sm text-slate-400 uppercase tracking-[0.2em] font-black">Awaiting Proxy Ingress...</p>
                    </div>
                  ) : (
                    apiLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="p-5 flex items-center justify-between hover:bg-blue-50 cursor-pointer group transition-all border-l-2 border-l-transparent hover:border-l-blue-600"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-1 h-10 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`} />
                          <div>
                            <div className="flex items-center gap-3">
                              <Badge className={`text-[10px] font-black uppercase tracking-widest px-2 ${log.method === 'GET' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                {log.method}
                              </Badge>
                              <p className="text-xs font-code text-slate-900 font-bold truncate max-w-[250px]">{log.endpoint}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 uppercase font-black tracking-tighter opacity-70">
                              {new Date(log.timestamp).toLocaleTimeString()} · SECURE EDGE PROXY
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-5">
                          {log.status === 'success' ? (
                            <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-[10px] font-black px-3">200 OK</Badge>
                          ) : (
                            <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 text-[10px] font-black px-3">ERROR</Badge>
                          )}
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="audit" className="flex-1 overflow-hidden m-0">
              <div className="p-16 border border-slate-200 bg-slate-50/50 rounded-2xl text-center h-full flex flex-col items-center justify-center shadow-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 border border-blue-200 shadow-md">
                  <ShieldAlert className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-headline font-black text-slate-900 mb-4 tracking-tight">OMNI-SHIELD ACTIVE</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed uppercase tracking-widest font-black opacity-60">Monitoring all external server handshakes. Security token verification enabled via Supabase Secure Protocol.</p>
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
        <DialogContent className="max-w-3xl bg-white border-slate-200 text-slate-900 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 font-headline text-2xl font-black text-slate-900">
                <Globe className="w-6 h-6 text-blue-600" />
                PACKET INSPECTOR
              </DialogTitle>
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 text-[11px] font-black uppercase px-4 py-1">REALTIME DATA</Badge>
            </div>
            <DialogDescription className="text-slate-500 font-code text-xs mt-3 uppercase font-bold tracking-tight">
              {selectedLog?.method} REQUEST TO INTERNAL GATEWAY: {selectedLog?.endpoint}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shadow-sm" />
                 <span className="text-[11px] uppercase font-black text-slate-500 tracking-[0.3em]">Payload Response Buffer</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCopyJson(selectedLog?.response)}
                className="h-9 gap-3 bg-white border-slate-200 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase px-6 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "BUFFER COPIED" : "COPY RAW JSON"}
              </Button>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
              <pre className="text-[13px] font-code terminal-scroll max-h-[500px] overflow-auto text-blue-400 leading-relaxed">
                {JSON.stringify(selectedLog?.response, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
