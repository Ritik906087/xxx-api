'use server';

import { detectFraudForTransactions, type DetectFraudOutput } from '@/ai/flows/ai-fraud-detection-for-transactions';
import { type TransactionType, type Transaction, MOCK_WALLETS, MOCK_USERS } from '@/lib/vantage-store';

export async function processTransaction(payload: {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
}) {
  const transactionId = `tx_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  // 1. Prepare Fraud Detection Input
  const fraudInput = {
    userId: payload.userId,
    transactionId: transactionId,
    amount: payload.amount,
    currency: 'USD',
    transactionType: payload.type,
    timestamp: timestamp,
    ipAddress: '192.168.1.1', // Mocked IP
    deviceFingerprint: 'browser_v1_f82j1',
    geographicalData: {
      country: 'US',
      city: 'New York'
    },
    userHistorySummary: 'User has consistent purchase history within normal limits.',
    accountAgeDays: 180,
    paymentMethodDetails: 'Known credit card ending in 4242'
  };

  // 2. Call AI Fraud Detection
  let fraudResult: DetectFraudOutput | null = null;
  try {
    fraudResult = await detectFraudForTransactions(fraudInput);
  } catch (error) {
    console.error('AI Fraud Detection Error:', error);
  }

  // 3. Simulated Transaction Execution
  const newTransaction: Transaction = {
    id: transactionId,
    userId: payload.userId,
    amount: payload.amount,
    currency: 'USD',
    type: payload.type,
    description: payload.description,
    timestamp: timestamp,
    isFraudulent: fraudResult?.isFraudulent ?? false
  };

  return {
    success: true,
    transaction: newTransaction,
    fraudDetection: fraudResult
  };
}

export async function requestOTP(email: string) {
  // Mocking MeraOTP Integration
  // apiKey: 4ef8fe7a7412390737d7a6e591
  console.log(`[MeraOTP] Sending OTP for ${email}...`);
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, message: 'OTP sent successfully' };
}

export async function verifyOTP(email: string, otp: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (otp === '123456') {
    return { success: true, user: MOCK_USERS[1] };
  }
  return { success: false, message: 'Invalid OTP' };
}

export async function getWalletBalance(userId: string) {
  const wallet = MOCK_WALLETS.find(w => w.userId === userId);
  return wallet?.balance ?? 0;
}