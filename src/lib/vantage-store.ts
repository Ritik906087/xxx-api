export type TransactionType = 'credit' | 'debit' | 'transfer' | 'withdrawal' | 'deposit' | 'purchase';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  timestamp: string;
  isFraudulent?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'flagged';
  type: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetId: string;
  timestamp: string;
  details: string;
}

// Initial Mock Data
export const MOCK_USERS: User[] = [
  { id: 'usr_01', email: 'admin@vantage.io', role: 'admin', createdAt: '2023-01-01T00:00:00Z' },
  { id: 'usr_02', email: 'user@example.com', role: 'user', createdAt: '2023-05-12T10:30:00Z' },
];

export const MOCK_WALLETS: Wallet[] = [
  { userId: 'usr_01', balance: 500000.00, currency: 'USD' },
  { userId: 'usr_02', balance: 1250.75, currency: 'USD' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx_01', userId: 'usr_02', amount: 50.00, currency: 'USD', type: 'purchase', description: 'Cloud Subscription', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'tx_02', userId: 'usr_02', amount: 100.00, currency: 'USD', type: 'deposit', description: 'Bank Transfer', timestamp: new Date(Date.now() - 7200000).toISOString() },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'log_01', adminId: 'usr_01', action: 'LEDGER_ADJUST', targetId: 'usr_02', timestamp: '2023-10-25T14:20:00Z', details: 'Manual balance adjustment of +$500.00' },
];