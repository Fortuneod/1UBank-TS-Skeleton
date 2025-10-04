// src/models/user.model.ts
export interface User {
  id: string;
  phoneNumber: string;
  bvn: string;
  email: string;
  accountNumber: string;
  accountBalance: number;
  transactionPin: string;
  tier: 'Tier1' | 'Tier2' | 'Tier3';
  isActive: boolean;
  createdAt: Date;
}

