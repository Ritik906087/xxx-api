'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { requestOTP, verifyOTP } from '@/app/actions/vantage-actions';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, KeyRound, Loader2 } from 'lucide-react';

export function AuthPanel({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!email) return;
    setIsLoading(true);
    const res = await requestOTP(email);
    setIsLoading(false);
    if (res.success) {
      setStep('otp');
      toast({ title: "OTP Sent", description: "Simulation: Use 123456" });
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const res = await verifyOTP(email, otp);
    setIsLoading(false);
    if (res.success) {
      onAuthSuccess(res.user);
    } else {
      toast({ variant: 'destructive', title: "Auth Failed", description: res.message });
    }
  };

  return (
    <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline font-bold">Vantage Omni-Auth</CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === 'email' ? 'Enter your institutional email to proceed' : 'Enter the 6-digit security code sent via OTP'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'email' ? (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground font-headline">Enterprise Identity</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                placeholder="identity@vantage.io" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10"
              />
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs uppercase tracking-widest text-muted-foreground font-headline">Security Token</Label>
            <div className="relative">
              <Input 
                id="otp" 
                type="text" 
                maxLength={6}
                placeholder="000000" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-background/50 border-primary/20 focus-visible:ring-primary h-12 pl-10 tracking-[1em] font-bold"
              />
              <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={step === 'email' ? handleSendOTP : handleVerify} 
          className="w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground group"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {step === 'email' ? 'Initiate Authentication' : 'Authorize Session'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}