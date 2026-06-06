'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ShieldCheck, Activity } from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'api';
  message: string;
  timestamp: string;
  details?: any;
}

export function VantageTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', type: 'info', message: 'Vantage Engine System Initialized', timestamp: new Date().toISOString() },
    { id: '2', type: 'success', message: 'MongoDB Transaction Handler Connected', timestamp: new Date().toISOString() },
    { id: '3', type: 'api', message: 'GET /api/v1/wallet/balance - 200 OK', timestamp: new Date().toISOString() }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-code font-semibold tracking-wider uppercase text-slate-500">System Engine Terminal</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-4 font-code text-[12px] leading-relaxed overflow-y-auto terminal-scroll bg-slate-50/30">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 flex gap-3 group">
            <span className="text-slate-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <div className="flex-1">
              <span className={`font-bold mr-2 ${
                log.type === 'error' ? 'text-rose-600' :
                log.type === 'success' ? 'text-emerald-600' :
                log.type === 'warning' ? 'text-amber-600' :
                log.type === 'api' ? 'text-blue-600' :
                'text-slate-700'
              }`}>
                {log.type.toUpperCase()}:
              </span>
              <span className="text-slate-800 font-medium">{log.message}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 animate-pulse text-blue-600 font-bold">
          <span>_</span>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-code text-slate-500 uppercase">Load: 12%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-code text-slate-500 uppercase">Auth: Active</span>
          </div>
        </div>
        <span className="text-[10px] font-code text-slate-400 uppercase">US-EAST-01</span>
      </div>
    </div>
  );
}
