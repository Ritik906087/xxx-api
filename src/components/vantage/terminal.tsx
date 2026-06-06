'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, ShieldCheck, Activity, AlertCircle } from 'lucide-react';

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

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date().toISOString(),
      details
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-accent" />
          <span className="text-xs font-code font-semibold tracking-wider uppercase text-muted-foreground">System Engine Terminal</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 p-4 font-code text-[13px] leading-relaxed overflow-y-auto terminal-scroll bg-background/50">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 flex gap-3 group">
            <span className="text-muted-foreground/40 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <div className="flex-1">
              <span className={`font-bold mr-2 ${
                log.type === 'error' ? 'text-destructive' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-amber-400' :
                log.type === 'api' ? 'text-accent' :
                'text-primary'
              }`}>
                {log.type.toUpperCase()}:
              </span>
              <span className="text-foreground/90">{log.message}</span>
              {log.details && (
                <pre className="mt-1 p-2 bg-secondary/50 rounded text-xs text-muted-foreground overflow-x-auto border border-white/5">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 animate-pulse text-accent">
          <span className="text-accent">_</span>
        </div>
      </div>

      <div className="px-4 py-2 bg-secondary/30 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-code text-muted-foreground uppercase">Load: 12%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-code text-muted-foreground uppercase">Auth: Active</span>
          </div>
        </div>
        <span className="text-[10px] font-code text-muted-foreground uppercase">Node: US-EAST-WORKER-01</span>
      </div>
    </div>
  );
}