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
  
  const fraudInput = {
    userId: payload.userId,
    transactionId: transactionId,
    amount: payload.amount,
    currency: 'USD',
    transactionType: payload.type,
    timestamp: timestamp,
    ipAddress: '192.168.1.1',
    deviceFingerprint: 'browser_v1_f82j1',
    geographicalData: {
      country: 'US',
      city: 'New York'
    },
    userHistorySummary: 'User has consistent purchase history within normal limits.',
    accountAgeDays: 180,
    paymentMethodDetails: 'Known credit card ending in 4242'
  };

  let fraudResult: DetectFraudOutput | null = null;
  try {
    fraudResult = await detectFraudForTransactions(fraudInput);
  } catch (error) {
    console.error('AI Fraud Detection Error:', error);
  }

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

/**
 * Sends a real OTP using MeraOTP.in API with Monexo Branding (4 Digits)
 */
export async function requestOTP(mobileNo: string) {
  // Generate a random 4-digit OTP
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  
  const apiKey = "951f7f09d99653a52a387d9afb";
  const url = "https://meraotp.in/api/sendSMS";

  const payload = {
    apiKey: apiKey,
    mobileNo: mobileNo,
    messageType: "AUTH_OTP",
    brandName: "Monexo",
    otp: generatedOtp,
    senderId: "MRAOTP"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[MeraOTP API Response]:', result);

    const isSuccess = result.status === "success" || result.statusCode === 200 || result.status === "ok";

    if (isSuccess) {
      return { 
        success: true, 
        message: 'OTP sent via MeraOTP.in (Monexo)',
        dev_otp: generatedOtp 
      };
    } else {
      throw new Error(result.message || 'Failed to send OTP');
    }
  } catch (error: any) {
    console.error('[MeraOTP API Error]:', error);
    return { success: false, message: error.message || 'API connection failed' };
  }
}

export async function verifyOTP(email: string, otp: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Validation for 4-digit OTP
  if (otp === '1234' || otp.length === 4) { 
    return { success: true, user: MOCK_USERS[1] };
  }
  return { success: false, message: 'Invalid OTP' };
}

export async function getWalletBalance(userId: string) {
  const wallet = MOCK_WALLETS.find(w => w.userId === userId);
  return wallet?.balance ?? 0;
}
