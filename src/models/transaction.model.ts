// src/models/transaction.model.ts
export interface Transaction {
  id: string;
  userId: string;
  type: 'transfer' | 'airtime' | 'data' | 'bill';
  amount: number;
  recipient?: string;
  recipientBank?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  description?: string;
}