// src/services/banking.service.ts
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';

export class BankingService {
  private users: Map<string, User> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  async verifyBVN(bvn: string): Promise<{ isValid: boolean; data?: any }> {
    // Simulate BVN verification API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock validation - in real scenario, call external API
        const isValid = bvn.length === 11 && /^\d+$/.test(bvn);
        resolve({
          isValid,
          data: isValid ? {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01'
          } : undefined
        });
      }, 1000);
    });
  }

  async createTier1Account(
    phoneNumber: string, 
    bvn: string, 
    email: string, 
    transactionPin: string
  ): Promise<User> {
    const user: User = {
      id: this.generateId(),
      phoneNumber,
      bvn,
      email,
      accountNumber: this.generateAccountNumber(),
      accountBalance: 0,
      transactionPin,
      tier: 'Tier1',
      isActive: true,
      createdAt: new Date()
    };

    this.users.set(phoneNumber, user);
    this.transactions.set(user.id, []);
    
    return user;
  }

  async verifyUser(phoneNumber: string): Promise<User | undefined> {
    return this.users.get(phoneNumber);
  }

  async verifyPin(user: User, pin: string): Promise<boolean> {
    return user.transactionPin === pin;
  }

  async getAccountBalance(user: User): Promise<number> {
    return user.accountBalance;
  }

  async getMiniStatement(user: User): Promise<Transaction[]> {
    const userTransactions = this.transactions.get(user.id) || [];
    return userTransactions.slice(-5).reverse();
  }

  async transferTo1UBank(
    user: User,
    recipientAccount: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    // Find recipient
    const recipient = Array.from(this.users.values()).find(
      u => u.accountNumber === recipientAccount
    );

    if (!recipient) {
      return { success: false, message: 'Recipient account not found' };
    }

    if (user.accountBalance < amount) {
      return { success: false, message: 'Insufficient funds' };
    }

    // Perform transfer
    user.accountBalance -= amount;
    recipient.accountBalance += amount;

    // Record transactions
    const debitTx: Transaction = {
      id: this.generateId(),
      userId: user.id,
      type: 'transfer',
      amount: -amount,
      recipient: recipientAccount,
      status: 'completed',
      timestamp: new Date(),
      description: `Transfer to ${recipientAccount}`
    };

    const creditTx: Transaction = {
      id: this.generateId(),
      userId: recipient.id,
      type: 'transfer',
      amount: amount,
      recipient: user.accountNumber,
      status: 'completed',
      timestamp: new Date(),
      description: `Transfer from ${user.accountNumber}`
    };

    this.transactions.get(user.id)?.push(debitTx);
    this.transactions.get(recipient.id)?.push(creditTx);

    return { success: true, message: 'Transfer successful' };
  }

  async buyAirtime(
    user: User,
    phoneNumber: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    if (user.accountBalance < amount) {
      return { success: false, message: 'Insufficient funds' };
    }

    user.accountBalance -= amount;

    const transaction: Transaction = {
      id: this.generateId(),
      userId: user.id,
      type: 'airtime',
      amount: -amount,
      recipient: phoneNumber,
      status: 'completed',
      timestamp: new Date(),
      description: `Airtime purchase for ${phoneNumber}`
    };

    this.transactions.get(user.id)?.push(transaction);

    return { success: true, message: 'Airtime purchase successful' };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateAccountNumber(): string {
    return '3' + Math.random().toString().substr(2, 9);
  }
}