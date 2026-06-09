'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  UserPlus,
  Activity,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Accounts', value: data?.stats.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'System Balance', value: `$${(data?.stats.totalBalance || 0).toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'New Today', value: data?.stats.newUsersToday || 0, icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Sessions', value: data?.stats.activeUsers || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Real-time Telemetry & Global Metrics</p>
        </div>
        <Button onClick={fetchStats} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-12 px-6 gap-3">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((s, idx) => (
          <Card key={idx} className="border-slate-200 shadow-sm hover:shadow-xl transition-all rounded-[2rem] overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <Badge variant="outline" className="border-slate-100 text-[10px] font-black uppercase text-slate-400">Live</Badge>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
              <h3 className="text-3xl font-headline font-black text-slate-900 mt-2">{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Recent Entry Stream</CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Latest user registrations mapped to node</p>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-600 opacity-20" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">User ID</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Identity</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timestamp</th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recentUsers.map((u: any) => (
                    <tr key={u._id} className="hover:bg-blue-50/40 transition-all cursor-default group">
                      <td className="p-6 text-xs font-bold text-slate-700 truncate max-w-[120px]">{u._id}</td>
                      <td className="p-6 font-black text-blue-600 text-sm tracking-widest">{u.mobileNo}</td>
                      <td className="p-6 text-[10px] text-slate-400 font-bold uppercase">{new Date(u.createdAt).toLocaleString()}</td>
                      <td className="p-6 text-right">
                        <Button variant="ghost" className="rounded-xl hover:bg-blue-100 text-blue-600">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-100">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Integrity Check</CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Security Layer</p>
                <p className="text-xs font-bold text-slate-900">JWT AUTH V2 ACTIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-lg shadow-blue-500/10">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Session Age</p>
                <p className="text-xs font-bold text-slate-900">EXPIRES IN 23H 58M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
