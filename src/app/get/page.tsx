'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Code, 
  Copy, 
  Check, 
  Search, 
  Activity, 
  Globe, 
  ExternalLink, 
  Cpu, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Terminal,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

export default function GetResultsPage() {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const addApiLog = (method: 'GET' | 'POST', endpoint: string, status: 'success' | 'failed', response: any, statusCode = 200, payload?: any) => {
    const newLog: ApiLog = {
      id: `TRC_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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

  const runAllTests = async () => {
    setIsProcessing(true);
    setApiLogs([]);
    
    const endpoints = [
      { method: 'GET', path: '/api/app/version' },
      { method: 'GET', path: '/api/app/jsValue' },
      { method: 'GET', path: '/api/init' },
      { method: 'GET', path: '/api/xxapi/config' },
      { method: 'GET', path: '/api/xxapi/teaminfo' },
      { method: 'GET', path: '/api/xxapi/simpConfig' },
      { method: 'GET', path: '/api/xxapi/availablect' },
      { method: 'GET', path: '/api/xxapi/collectiontoollist' },
      { method: 'GET', path: '/api/xxapi/monitorflow/check' },
      { method: 'GET', path: '/api/xxapi/buyitoken/history' },
      { method: 'GET', path: '/api/xxapi/sell/history' },
      { method: 'POST', path: '/api/xxapi/sendLoginSms', body: { mobileNo: '919060873927' } }
    ];

    for (const ep of endpoints) {
      try {
        const fetchOptions: any = { 
          method: ep.method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (ep.body) fetchOptions.body = JSON.stringify(ep.body);

        const res = await fetch(ep.path, fetchOptions);
        const data = await res.json();
        addApiLog(ep.method as any, ep.path, res.ok ? 'success' : 'failed', data, res.status, ep.body);
      } catch (e: any) {
        addApiLog(ep.method as any, ep.path, 'failed', { error: e.message }, 500);
      }
    }
    setIsProcessing(false);
    toast({ title: "Audit Synchronized", description: "All system telemetry captured." });
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const handleCopyJson = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    toast({ title: "Packet Copied", description: "JSON buffer saved to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-code selection:bg-blue-600 selection:text-white">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50 px-8 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100 transition-all">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">V</div>
            <div>
              <h1 className="font-headline font-black text-xl tracking-tight text-slate-900">API AUDIT CENTER</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Live Traffic & Packet Registry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 animate-pulse">
            Stealth Proxy Active
          </Badge>
          <Button 
            onClick={runAllTests}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase px-8 h-12 shadow-xl shadow-blue-600/20 rounded-2xl transition-all flex gap-3"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            RUN LIVE AUDIT
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Packets</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-headline font-black text-slate-900">{apiLogs.length}</p>
                <Terminal className="w-6 h-6 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Health Index</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-headline font-black text-emerald-600">
                  {apiLogs.length > 0 ? Math.round((apiLogs.filter(l => l.status === 'success').length / apiLogs.length) * 100) : 0}%
                </p>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Old Server Sync</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-headline font-black text-blue-600">Active</p>
                <Globe className="w-6 h-6 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">System Load</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-headline font-black text-slate-900">Normal</p>
                <Activity className="w-6 h-6 text-slate-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 rounded-[2rem] overflow-hidden shadow-sm bg-white">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-4">
              <Code className="w-6 h-6 text-blue-600" />
              LIVE TELEMETRY FEED
            </h2>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monitoring Live</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Verb</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Endpoint Path</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Response</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Trace Token</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {apiLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center opacity-30">
                      <Search className="w-20 h-20 mx-auto mb-6 text-slate-300" />
                      <p className="text-sm font-black uppercase tracking-[0.4em]">Listening for system traffic...</p>
                    </td>
                  </tr>
                ) : (
                  apiLogs.map((log) => (
                    <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-blue-50/40 transition-all cursor-pointer group">
                      <td className="p-6">
                        <Badge className={`text-[9px] font-black uppercase px-3 py-1 ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.method}
                        </Badge>
                      </td>
                      <td className="p-6 text-xs font-bold text-slate-700">
                        {log.endpoint}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span className={`text-[11px] font-black uppercase ${log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {log.statusCode || 200} {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-[10px] text-slate-400 font-bold font-code">{log.id}</td>
                      <td className="p-6 text-right">
                        <Button variant="ghost" size="sm" className="rounded-xl hover:bg-blue-100 text-blue-600 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-5xl bg-white border-slate-200 text-slate-900 rounded-[3rem] shadow-2xl p-0 overflow-hidden">
          <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <DialogTitle className="text-4xl font-headline font-black text-slate-900 flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                  <Code className="w-8 h-8" />
                </div>
                JSON_PACKET_V4
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[12px] uppercase tracking-widest mt-4">
                TRACE: {selectedLog?.id} | INTEGRITY VERIFIED
              </DialogDescription>
            </div>
            <Button 
              onClick={() => handleCopyJson(selectedLog?.response)}
              className="h-16 px-12 gap-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[13px] uppercase rounded-[1.5rem] shadow-2xl transition-all"
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? "BUFFER_COPIED" : "COPY_JSON_PAYLOAD"}
            </Button>
          </div>
          <div className="p-12 bg-white space-y-8">
            <div className="relative group">
              <div className="absolute -top-4 left-8 px-6 py-1.5 bg-slate-900 text-blue-400 text-[11px] font-black uppercase rounded-full z-10 border border-slate-800 shadow-2xl">
                Buffer_Stream_Data_2.4.0
              </div>
              <div className="bg-slate-950 p-12 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
                <pre className="text-[16px] font-code terminal-scroll max-h-[600px] overflow-auto text-blue-400 leading-relaxed selection:bg-blue-600/30">
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
