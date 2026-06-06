
export type TransactionType = 'credit' | 'debit' | 'transfer' | 'withdrawal' | 'deposit' | 'purchase';

export interface User {
  id: string;
  email: string;
  mobileNo: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  timestamp: string;
  isFraudulent: boolean;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  type: string;
  timestamp: string;
}

export interface Config {
  brandName: string;
  version: string;
  maintenance: boolean;
  minDeposit: number;
  maxWithdrawal: number;
}

export const MOCK_USERS: User[] = [
  {
    id: 'usr_1',
    email: 'admin@vantage.io',
    mobileNo: '919060873927',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_2',
    email: 'user@example.com',
    mobileNo: '911234567890',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_WALLETS: Wallet[] = [
  {
    userId: 'usr_1',
    balance: 50000.00,
    currency: 'USD',
    lastUpdated: new Date().toISOString()
  },
  {
    userId: 'usr_2',
    balance: 1250.75,
    currency: 'USD',
    lastUpdated: new Date().toISOString()
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    userId: 'usr_1',
    amount: 1500.00,
    currency: 'USD',
    type: 'deposit',
    description: 'Initial balance load',
    timestamp: new Date().toISOString(),
    isFraudulent: false
  }
];
