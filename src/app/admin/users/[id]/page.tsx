'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Wallet, 
  History, 
  Ban, 
  CheckCircle2, 
  Trash2, 
  ShieldAlert,
  Loader2,
  Save,
  Plus,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function UserDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balanceInput, setBalanceInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const json = await res.json();
      if (res.ok) setData(json.data);
    } catch (e) {
      toast({ variant: 'destructive', title: "Load Error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdate = async (payload: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Node updated successfully." });
        fetchDetails();
        setBalanceInput('');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: "Purged", description: "User permanently deleted." });
      router.push('/admin/users');
    }
  };

  if (loading) return <div className="p-32 text-center animate-pulse font-black uppercase text-slate-400">Interrogating Node...</div>;

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-6">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl border-slate-200 h-12 w-12 p-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">{data.user.mobileNo}</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Identity Details & Control Nexus</p>
        </div>
        <div className="ml-auto flex gap-4">
          <Button 
            onClick={() => handleUpdate({ action: 'status', status: data.user.status === 1 ? 0 : 1 })}
            className={`h-12 px-8 rounded-xl font-black uppercase text-xs gap-3 ${data.user.status === 1 ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'}`}
          >
            {data.user.status === 1 ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {data.user.status === 1 ? 'Freeze Node' : 'Unfreeze Node'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="h-12 w-12 p-0 rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="w-5 h-5" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white rounded-[2rem] border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-headline font-black">Confirm Permanent Purge?</AlertDialogTitle>
                <AlertDialogDescription className="font-bold">This action will erase the user's identity and balance history from MongoDB. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-rose-600 rounded-xl">Execute Purge</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-100 flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Wallet Engine</CardTitle>
              <Wallet className="w-6 h-6 text-blue-600 opacity-20" />
            </CardHeader>
            <CardContent className="p-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Liquidity</p>
              <h3 className="text-5xl font-headline font-black text-slate-900 mt-2 tracking-tighter">${(data.user.itoken || 0).toLocaleString()}</h3>
              
              <div className="mt-12 space-y-4">
                <div className="relative">
                  <Input 
                    type="number" 
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="Enter Amount"
                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl pl-6 pr-20 font-black text-lg"
                  />
                  <div className="absolute right-4 top-4 text-[10px] font-black text-slate-400 uppercase">USD</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleUpdate({ action: 'balance', amount: balanceInput })}
                    className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-3 font-black uppercase text-xs"
                    disabled={isUpdating || !balanceInput}
                  >
                    <Plus className="w-4 h-4" /> Credit
                  </Button>
                  <Button 
                    onClick={() => handleUpdate({ action: 'balance', amount: -parseFloat(balanceInput) })}
                    className="h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl gap-3 font-black uppercase text-xs"
                    disabled={isUpdating || !balanceInput}
                  >
                    <Minus className="w-4 h-4" /> Debit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-100">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Node Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Username</span>
                <span className="text-xs font-bold text-slate-900">{data.user.username || 'UNSET'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Registered</span>
                <span className="text-xs font-bold text-slate-900">{new Date(data.user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Identity Type</span>
                <Badge variant="outline" className="text-[9px] font-black uppercase px-3">Enterprise</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Transaction Ledger</CardTitle>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Audit stream for this specific node</p>
              </div>
              <History className="w-6 h-6 text-blue-600 opacity-20" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Token ID</th>
                      <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                      <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Value</th>
                      <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-xs">No ledger entries found</td>
                      </tr>
                    ) : (
                      data.transactions.map((tx: any) => (
                        <tr key={tx._id} className="hover:bg-slate-50 transition-all">
                          <td className="p-8 text-xs font-bold text-slate-500 truncate max-w-[120px]">{tx._id}</td>
                          <td className="p-8"><Badge variant="outline" className="text-[9px] font-black uppercase">{tx.type || 'TX'}</Badge></td>
                          <td className={`p-8 font-black text-right ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </td>
                          <td className="p-8 text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.timestamp).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
