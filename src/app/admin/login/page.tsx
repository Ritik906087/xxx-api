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
        toast({ 
          title: "Authorized", 
          description: "Initializing secure session...",
          duration: 2000 
        });
        
        // Use window.location.href for a hard redirect to ensure cookies are sent and middleware triggers correctly
        setTimeout(() => {
          window.location.href = '/admin';
        }, 500);
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Auth Failed", 
          description: data.msg || "Invalid credentials provided." 
        });
      }
    } catch (e) {
      toast({ 
        variant: 'destructive', 
        title: "Network Error",
        description: "Could not establish connection to Auth server."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-code relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 opacity-50" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://picsum.photos/seed/bg/1920/1080')] opacity-5 grayscale" />
      
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border-slate-800 shadow-2xl relative z-10 rounded-[2.5rem]">
        <CardHeader className="text-center space-y-4 pt-12 pb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/30 rotate-3 transition-transform hover:rotate-0">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-headline font-black text-white tracking-tight">VANTAGE ADMIN</CardTitle>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2">Institutional Control Access v6.1</p>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 px-10 pb-10">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Identity Profile</Label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin ID"
                className="bg-slate-800/50 border-slate-700 text-white h-14 rounded-2xl focus:ring-blue-600 focus:border-blue-600 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Access Key</Label>
              <div className="relative">
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800/50 border-slate-700 text-white h-14 rounded-2xl pr-14 focus:ring-blue-600 focus:border-blue-600 transition-all"
                  required
                />
                <Lock className="absolute right-5 top-4.5 w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-10 pb-12">
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  <Lock className="w-4 h-4" />
                  Request Access
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-8 text-center w-full z-10">
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Secured by Vantage Shield Protocol</p>
      </div>
    </div>
  );
}