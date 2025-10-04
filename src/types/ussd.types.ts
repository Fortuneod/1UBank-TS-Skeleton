// src/types/ussd.types.ts
export interface USSDRequest {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  text: string;
  networkCode?: string;
}

export interface USSDResponse {
  sessionId: string;
  message: string;
  continueSession: boolean;
}

export interface UserSession {
  sessionId: string;
  phoneNumber: string;
  currentMenu: string;
  previousMenu: string;
  data: Record<string, any>;
  createdAt: Date;
  lastUpdated: Date;
}

export interface TransactionData {
  amount?: number;
  recipientAccount?: string;
  recipientBank?: string;
  recipientName?: string;
  transactionType?: string;
  pin?: string;
}

export interface AirtimeDataRequest {
  type: 'airtime' | 'data';
  beneficiary: 'self' | 'other';
  network?: string;
  phoneNumber?: string;
  amount?: number;
  package?: string;
}

export interface BillPaymentRequest {
  type: 'electricity' | 'tv';
  provider?: string;
  accountNumber?: string;
  meterNumber?: string;
  smartcardNumber?: string;
  amount?: number;
  package?: string;
}