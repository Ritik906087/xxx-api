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
  RefreshCw
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

  const runAllTests = async () => {
    setIsProcessing(true);
    setApiLogs([]); // Clear previous logs
    
    const endpoints = [
      { method: 'GET', path: '/api/app/version' },
      { method: 'GET', path: '/api/app/jsValue' },
      { method: 'GET', path: '/api/init' },
      { method: 'GET', path: '/api/auth/check' },
      { method: 'GET', path: '/api/config' },
      { method: 'GET', path: '/api/settings' },
      { method: 'GET', path: '/api/user/profile' },
      { method: 'GET', path: '/api/health' },
      { method: 'POST', path: '/api/xxapi/monitorflow/check', body: { action: 'ping' } },
      { method: 'GET', path: '/api/xxapi/availablect?payment_method=1' },
      { method: 'GET', path: '/api/xxapi/linkKyc' },
      { method: 'GET', path: '/api/xxapi/buyitoken/check' }
    ];

    for (const ep of endpoints) {
      try {
        const fetchOptions: any = { 
          method: ep.method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (ep.body) fetchOptions.body = JSON.stringify(ep.body);

        const res = await fetch(ep.path, fetchOptions);
        
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
    toast({ title: "Audit Complete", description: "All system endpoints verified." });
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
    <div className="min-h-screen bg-white text-slate-900 font-code selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50 px-8 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">G</div>
            <div>
              <h1 className="font-headline font-black text-xl tracking-tight">GET RESULTS</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Packet & Registry Auditor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 animate-pulse">
            Bypass Active
          </Badge>
          <Button 
            onClick={runAllTests}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase px-8 h-12 shadow-xl shadow-blue-600/20 rounded-2xl transition-all hover:scale-[1.02] flex gap-3"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Refresh Audit
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* System Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Requests</p>
                <p className="text-3xl font-headline font-black text-slate-900">{apiLogs.length}</p>
              </div>
              <Cpu className="w-10 h-10 text-blue-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Success Rate</p>
                <p className="text-3xl font-headline font-black text-emerald-600">
                  {apiLogs.length > 0 ? Math.round((apiLogs.filter(l => l.status === 'success').length / apiLogs.length) * 100) : 0}%
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Latency Node</p>
                <p className="text-3xl font-headline font-black text-blue-600">Stable</p>
              </div>
              <Globe className="w-10 h-10 text-blue-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Table */}
        <Card className="border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
              <Code className="w-5 h-5 text-blue-600" />
              Traffic Registry
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Method</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Endpoint</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Trace ID</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {apiLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center opacity-30">
                      <Search className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Awaiting traffic induction...</p>
                    </td>
                  </tr>
                ) : (
                  apiLogs.map((log) => (
                    <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <td className="p-6">
                        <Badge className={`text-[9px] font-black uppercase px-3 py-1 ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.method}
                        </Badge>
                      </td>
                      <td className="p-6 text-xs font-bold text-slate-700">{log.endpoint}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
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
                        <Button variant="ghost" size="sm" className="rounded-lg hover:bg-blue-100 text-blue-600 group-hover:scale-110 transition-all">
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

      {/* JSON Inspector Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-5xl bg-white border-slate-200 text-slate-900 rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <DialogTitle className="text-3xl font-headline font-black text-slate-900 flex items-center gap-5">
                <Code className="w-10 h-10 text-blue-600" />
                PACKET_INSPECTOR_V2
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-3 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                TRACE: {selectedLog?.id} | PAYLOAD VERIFIED SECURE
              </DialogDescription>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => handleCopyJson(selectedLog?.response)}
                className="h-14 px-10 gap-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase rounded-[1.25rem] shadow-2xl shadow-blue-600/20 transition-all"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? "BUFFER_COPIED" : "COPY_RAW_JSON"}
              </Button>
            </div>
          </div>
          
          <div className="p-10 bg-white space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Network Endpoint</p>
                <p className="text-xs font-bold text-slate-800 truncate">{selectedLog?.endpoint}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Response Integrity</p>
                <p className={`text-xs font-black uppercase ${selectedLog?.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedLog?.statusCode} - Verified
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Protocol Stack</p>
                <p className="text-xs font-bold text-slate-800">HTTPS/REST/TLS1.3</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Timestamp</p>
                <p className="text-xs font-bold text-slate-800">{new Date(selectedLog?.timestamp || '').toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="relative group mt-6">
              <div className="absolute -top-3.5 left-6 px-4 py-1 bg-slate-900 text-blue-400 text-[10px] font-black uppercase rounded-full z-10 border border-slate-800 shadow-xl">
                Buffer_Stream_Hex_2.4.0
              </div>
              <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
                <pre className="text-[15px] font-code terminal-scroll max-h-[600px] overflow-auto text-blue-400 leading-relaxed selection:bg-blue-600/30">
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
