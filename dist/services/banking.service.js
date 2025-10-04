"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankingService = void 0;
class BankingService {
    constructor() {
        this.users = new Map();
        this.transactions = new Map();
    }
    async verifyBVN(bvn) {
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
    async createTier1Account(phoneNumber, bvn, email, transactionPin) {
        const user = {
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
    async verifyUser(phoneNumber) {
        return this.users.get(phoneNumber);
    }
    async verifyPin(user, pin) {
        return user.transactionPin === pin;
    }
    async getAccountBalance(user) {
        return user.accountBalance;
    }
    async getMiniStatement(user) {
        const userTransactions = this.transactions.get(user.id) || [];
        return userTransactions.slice(-5).reverse();
    }
    async transferTo1UBank(user, recipientAccount, amount) {
        // Find recipient
        const recipient = Array.from(this.users.values()).find(u => u.accountNumber === recipientAccount);
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
        const debitTx = {
            id: this.generateId(),
            userId: user.id,
            type: 'transfer',
            amount: -amount,
            recipient: recipientAccount,
            status: 'completed',
            timestamp: new Date(),
            description: `Transfer to ${recipientAccount}`
        };
        const creditTx = {
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
    async buyAirtime(user, phoneNumber, amount) {
        if (user.accountBalance < amount) {
            return { success: false, message: 'Insufficient funds' };
        }
        user.accountBalance -= amount;
        const transaction = {
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
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    generateAccountNumber() {
        return '3' + Math.random().toString().substr(2, 9);
    }
}
exports.BankingService = BankingService;
