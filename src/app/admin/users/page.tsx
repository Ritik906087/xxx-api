'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  User as UserIcon, 
  ExternalLink, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${search}&page=${page}`);
      const json = await res.json();
      setUsers(json.data.users);
      setTotalPages(json.data.pagination.pages);
    } catch (e) {
      toast({ variant: 'destructive', title: "Fetch Failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [search, page]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">User Registry</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Manage global identity stream & account states</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-96 group">
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Mobile / Username..."
              className="bg-white border-slate-200 h-14 pl-14 rounded-2xl shadow-sm focus:ring-blue-600 focus:border-blue-600 transition-all"
            />
            <Search className="absolute left-5 top-4.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <Button className="h-14 w-14 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">User ID (MongoDB)</th>
                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Mobile Identity</th>
                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Balance (iToken)</th>
                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">Synchronizing Records...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">No matching identities found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-blue-50/40 transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-code text-slate-500 truncate max-w-[150px]">{user._id}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="font-black text-slate-900 tracking-widest">{user.mobileNo}</span>
                      </div>
                    </td>
                    <td className="p-8 font-black text-emerald-600 text-lg">${(user.itoken || 0).toLocaleString()}</td>
                    <td className="p-8 text-center">
                      <Badge className={`text-[9px] font-black uppercase px-3 py-1 ${user.status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {user.status === 1 ? 'ACTIVE' : 'BLOCKED'}
                      </Badge>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" asChild className="rounded-xl h-10 w-10 p-0 text-blue-600 hover:bg-blue-100">
                          <Link href={`/admin/users/${user.mobileNo}`}><ExternalLink className="w-4 h-4" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          className="rounded-xl border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages}</span>
        <Button 
          variant="outline" 
          disabled={page === totalPages} 
          onClick={() => setPage(p => p + 1)}
          className="rounded-xl border-slate-200"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
