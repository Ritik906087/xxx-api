
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VantageTerminal } from './terminal';
import { MOCK_WALLETS, MOCK_TRANSACTIONS, type Transaction, type User } from '@/lib/vantage-store';
import { processTransaction } from '@/app/actions/vantage-actions';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, Globe, User as UserIcon, Copy, Check, ExternalLink, Play, Search, Code, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ApiLog {
  id: string;
  method: 'GET' | 'POST';
  endpoint: string;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  timestamp: string;
  response: any;
  payload?: any;
}

export function DashboardView({ user }: { user: User }) {
  const [balance, setBalance] = useState(MOCK_WALLETS.find(w => w.userId === user.id)?.balance ?? 0);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    addApiLog('GET', '/api/xxapi/config', 'success', { brand: 'Vantage', version: '2.4.0' }, 200);
    addApiLog('GET', '/api/xxapi/userinfo', 'success', { id: user.id, mobile: user.mobileNo }, 200);
  }, []);

  const addApiLog = (method: 'GET' | 'POST', endpoint: string, status: 'success' | 'failed', response: any, statusCode = 200, payload?: any) => {
    const newLog: ApiLog = {
      id: `trc_${Math.random().toString(36).substr(2, 7)}`,
      method,
      endpoint,
      status,
      statusCode,
      timestamp: new Date().toISOString(),
      response,
      payload
    };
    setApiLogs(prev => [newLog, ...prev]);
  };

  const handleCopyJson = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    toast({ title: "Buffer Copied", description: "JSON packet is now in clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const runProxyTest = async () => {
    setIsProcessing(true);
    setActiveTab('logs');
    
    const endpoints = [
      { method: 'GET', path: '/api/app/version' },
      { method: 'POST', path: '/api/xxapi/monitorflow/check', body: { action: 'ping' } },
      { method: 'GET', path: '/api/xxapi/availablect?payment_method=1' }
    ];

    for (const ep of endpoints) {
      try {
        const fetchOptions: any = { 
          method: ep.method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (ep.body) fetchOptions.body = JSON.stringify(ep.body);

        const res = await fetch(ep.path, fetchOptions);
        
        // Handle potential non-JSON responses to avoid parsing errors
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          data = { error: "Non-JSON response received", raw: await res.text() };
        }
        
        addApiLog(ep.method as any, ep.path, res.ok ? 'success' : 'failed', data, res.status, ep.body);
      } catch (e: any) {
        addApiLog(ep.method as any, ep.path, 'failed', { error: e.message }, 500);
      }
    }
    setIsProcessing(false);
  };

  const handleTestTransaction = async (amount: number, type: 'purchase' | 'deposit' | 'withdrawal') => {
    setIsProcessing(true);
    const payload = { userId: user.id, amount, type, description: `Simulation ${type}` };
    
    try {
      const res = await processTransaction(payload);
      setIsProcessing(false);

      if (res.success) {
        addApiLog('POST', '/api/v1/ledger/process', 'success', res, 201, payload);
        if (res.transaction.isFraudulent) {
          toast({ variant: 'destructive', title: 'Security Alert', description: 'AI Flagged high-risk pattern.' });
        } else {
          setTransactions(prev => [res.transaction, ...prev]);
          setBalance(prev => type === 'deposit' ? prev + amount : prev - amount);
          toast({ title: 'Settlement OK', description: 'Transaction written to MongoDB Atlas.' });
        }
      } else {
        addApiLog('POST', '/api/v1/ledger/process', 'failed', res, 400, payload);
      }
    } catch (e: any) {
      setIsProcessing(false);
      addApiLog('POST', '/api/v1/ledger/process', 'failed', { error: e.message }, 500, payload);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-slate-900 font-code">
      <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-headline font-black text-2xl text-white shadow-lg shadow-blue-600/20">V</div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xl tracking-tight text-slate-900 leading-none">VANTAGE ENGINE</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black mt-1">Hybrid Cloud Gateway</span>
          </div>
          <div className="h-8 w-px bg-slate-200 ml-2" />
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-50 text-[10px] uppercase font-bold px-4 py-1.5">Node: Stable</Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={runProxyTest}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase px-10 h-12 shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex gap-3"
          >
            {isProcessing ? <Cpu className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            GET RESULTS
          </Button>

          <div className="hidden xl:flex items-center gap-4 px-5 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">{user.mobileNo}</span>
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] uppercase font-black">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-8 gap-8 grid grid-cols-12 max-w-[1800px] mx-auto w-full">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card className="bg-white border-slate-200 overflow-hidden border-l-4 border-l-blue-600 shadow-sm transition-hover hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                Liquid Balance (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-headline font-bold tracking-tighter text-slate-900">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-600 uppercase">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sync Mode: Realtime
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Action Nodes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-2">
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-16 border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                onClick={() => handleTestTransaction(150.00, 'deposit')}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-tight">Deposit</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Target: MongoDB</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-4 h-16 border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                onClick={() => handleTestTransaction(1200.00, 'purchase')}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-tight">Purchase</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Target: Gateway</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <TabsList className="bg-slate-100/50 border border-slate-200 p-1.5 h-14 rounded-2xl">
                <TabsTrigger value="transactions" className="gap-2 text-[10px] uppercase font-black tracking-widest px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
                  <History className="w-4 h-4" />
                  Ledger
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 text-[10px] uppercase font-black tracking-widest px-6 data-[state=active]:bg-blue-600 data-[state=active]:shadow-lg data-[state=active]:text-white">
                  <Globe className="w-4 h-4" />
                  Get Results
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 text-[10px] font-black uppercase tracking-tighter animate-pulse">Stealth Proxy ON</Badge>
              </div>
            </div>
            
            <TabsContent value="transactions" className="flex-1 overflow-hidden m-0">
              <div className="bg-white rounded-3xl border border-slate-200 h-full overflow-y-auto terminal-scroll shadow-sm">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-6 uppercase tracking-widest text-slate-400 text-[10px] font-black">Trace ID</th>
                      <th className="p-6 uppercase tracking-widest text-slate-400 text-[10px] font-black">Type</th>
                      <th className="p-6 uppercase tracking-widest text-slate-400 text-[10px] font-black text-right">Value</th>
                      <th className="p-6 uppercase tracking-widest text-slate-400 text-[10px] font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-all cursor-default group">
                        <td className="p-6 font-bold text-slate-500 group-hover:text-blue-600">{tx.id}</td>
                        <td className="p-6"><Badge variant="outline" className="text-[10px] font-black uppercase border-slate-200">{tx.type}</Badge></td>
                        <td className={`p-6 font-black text-right text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-6">
                          {tx.isFraudulent ? (
                            <Badge variant="destructive" className="text-[9px] font-black uppercase px-3">Blocked</Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase px-3">Settled</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
              <div className="bg-white rounded-3xl border border-slate-200 h-full flex flex-col overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Code className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Network Request Monitor</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setApiLogs([])} className="h-8 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-xl">Clear All</Button>
                </div>
                <div className="flex-1 overflow-y-auto terminal-scroll p-4 space-y-3 bg-slate-50/20">
                  {apiLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-30">
                      <Search className="w-16 h-16 mb-6 text-slate-300" />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">Listening for traffic...</p>
                    </div>
                  ) : (
                    apiLogs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="bg-white border border-slate-200 p-5 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-2 h-10 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg`} />
                          <div>
                            <div className="flex items-center gap-3">
                              <Badge className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {log.method}
                              </Badge>
                              <span className="text-xs font-bold text-slate-800 truncate max-w-[300px]">{log.endpoint}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 opacity-60">
                              <span className="text-[10px] font-black uppercase tracking-tight">{log.id}</span>
                              <span className="text-[10px] font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={`font-black text-[10px] border-slate-200 ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.statusCode || 200} {log.status.toUpperCase()}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden">
          <VantageTerminal />
        </div>
      </main>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl bg-white border-slate-200 text-slate-900 rounded-[2rem] shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <DialogTitle className="text-2xl font-headline font-black text-slate-900 flex items-center gap-4">
                <Code className="w-8 h-8 text-blue-600" />
                PACKET INSPECTOR
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                Trace: {selectedLog?.id} | Gateway Bypass Active
              </DialogDescription>
            </div>
            <Button 
              onClick={() => handleCopyJson(selectedLog?.response)}
              className="h-12 px-8 gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase rounded-2xl shadow-xl shadow-blue-600/20 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Buffer Copied" : "Copy Raw JSON"}
            </Button>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Endpoint Target</p>
                <p className="text-xs font-bold text-slate-800 truncate">{selectedLog?.endpoint}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Status Integrity</p>
                <p className={`text-xs font-black uppercase ${selectedLog?.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedLog?.statusCode} - Verified Secure
                </p>
              </div>
            </div>
            
            <div className="relative group">
               <div className="absolute -top-3 left-4 px-3 bg-slate-900 text-blue-400 text-[9px] font-black uppercase rounded-full z-10 border border-slate-800">Response_Body_v2.4</div>
               <div className="bg-slate-950 p-8 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden min-h-[400px]">
                <pre className="text-[14px] font-code terminal-scroll max-h-[500px] overflow-auto text-blue-400 leading-relaxed selection:bg-blue-600/30">
                  {JSON.stringify(selectedLog?.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
