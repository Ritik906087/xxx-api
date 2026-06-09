'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Authorized", description: "Welcome back, Administrator." });
        router.push('/admin');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: "Auth Failed", description: data.msg });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Network Error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-code">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/bg/1920/1080')] opacity-10 grayscale" />
      
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border-slate-800 shadow-2xl relative">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-600/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline font-black text-white tracking-tight">VANTAGE ADMIN</CardTitle>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Institutional Control Access</p>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-400">Identity</Label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin ID"
                className="bg-slate-800/50 border-slate-700 text-white h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-400">Pass-Key</Label>
              <div className="relative">
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800/50 border-slate-700 text-white h-12"
                  required
                />
                <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Access System"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
