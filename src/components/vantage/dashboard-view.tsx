'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VantageTerminal } from './terminal';
import { MOCK_WALLETS, MOCK_TRANSACTIONS, type Transaction, type User } from '@/lib/vantage-store';
import { processTransaction } from '@/app/actions/vantage-actions';
import { Wallet, ArrowUpRight, ArrowDownLeft, ShieldAlert, History, LayoutDashboard, Settings, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DashboardView({ user }: { user: User }) {
  const [balance, setBalance] = useState(MOCK_WALLETS.find(w => w.userId === user.id)?.balance ?? 0);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleTestTransaction = async (amount: number, type: 'purchase' | 'deposit' | 'withdrawal') => {
    setIsProcessing(true);
    const res = await processTransaction({
      userId: user.id,
      amount,
      type,
      description: `Testing ${type} pattern`
    });
    setIsProcessing(false);

    if (res.success) {
      if (res.transaction.isFraudulent) {
        toast({
          variant: 'destructive',
          title: 'Smart-Shield Alert',
          description: `AI Flagged this transaction: ${res.fraudDetection?.reasoning}`
        });
      } else {
        setTransactions(prev => [res.transaction, ...prev]);
        setBalance(prev => type === 'deposit' ? prev + amount : prev - amount);
        toast({ title: 'Transaction Successful', description: 'Atomic ledger updated.' });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-headline font-bold text-lg italic">V</div>
          <span className="font-headline font-bold text-xl tracking-tighter">VANTAGE ENGINE</span>
          <Badge variant="outline" className="ml-2 border-accent/20 text-accent bg-accent/5 text-[10px] uppercase font-bold">V1.0.4-LATEST</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-secondary rounded-full border border-white/5">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground/80">{user.email}</span>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-[10px]">{user.role.toUpperCase()}</Badge>
          </div>
          <Settings className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-12">
        {/* Left Sidebar Actions */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card className="bg-card/40 border-primary/10 overflow-hidden group">
            <div className="h-1 bg-gradient-to-r from-primary to-accent" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-headline flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5" />
                Live Liquid Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-headline font-bold tracking-tight mb-1">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] font-code text-accent flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Real-time MongoDB Sync: Active
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-headline">Command Center</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-11 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                onClick={() => handleTestTransaction(250.00, 'deposit')}
                disabled={isProcessing}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Debit Ingress (Deposit)
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-11 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => handleTestTransaction(1200.00, 'purchase')}
                disabled={isProcessing}
              >
                <ArrowUpRight className="w-4 h-4 text-primary" />
                Execute Purchase
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-11 border-white/10 hover:bg-destructive/10 hover:border-destructive/30"
                onClick={() => handleTestTransaction(50000.00, 'withdrawal')}
                disabled={isProcessing}
              >
                <ShieldAlert className="w-4 h-4 text-destructive" />
                Trigger High-Risk Auth
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Main Content */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          <Tabs defaultValue="transactions" className="w-full flex-1 flex flex-col">
            <TabsList className="bg-card/50 border border-white/5 w-fit">
              <TabsTrigger value="transactions" className="gap-2">
                <History className="w-4 h-4" />
                Transaction Stream
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <ShieldAlert className="w-4 h-4" />
                Security Audit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="flex-1 mt-4 overflow-hidden">
              <div className="bg-card/30 rounded-lg border border-white/5 h-full overflow-y-auto terminal-scroll">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="sticky top-0 bg-secondary/80 backdrop-blur-md z-10 border-b border-white/5">
                    <tr>
                      <th className="p-4 font-headline uppercase tracking-tighter text-muted-foreground font-semibold">ID</th>
                      <th className="p-4 font-headline uppercase tracking-tighter text-muted-foreground font-semibold">Type</th>
                      <th className="p-4 font-headline uppercase tracking-tighter text-muted-foreground font-semibold text-right">Amount</th>
                      <th className="p-4 font-headline uppercase tracking-tighter text-muted-foreground font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 font-code text-muted-foreground">{tx.id}</td>
                        <td className="p-4 font-medium uppercase">{tx.type}</td>
                        <td className={`p-4 font-code font-bold text-right ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-foreground'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          {tx.isFraudulent ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">FLAGGED</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 bg-emerald-400/5 text-[10px]">SETTLED</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="audit" className="mt-4">
              <div className="p-8 border border-white/5 bg-card/30 rounded-lg text-center">
                <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-headline font-bold mb-2">Security Audit Active</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">Vantage Smart-Shield is monitoring all requests in real-time. No critical violations found in current session.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Terminal Panel */}
        <div className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden">
          <VantageTerminal />
        </div>
      </main>
    </div>
  );
}