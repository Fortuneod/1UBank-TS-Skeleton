// src/handlers/transfer.handler.ts
import { BankingService } from '../services/banking.service';
import { MenuHandler } from './menu.handler';
import { USSDResponse, UserSession } from '../types/ussd.types';

export class TransferHandler {
  private bankingService: BankingService;

  constructor(bankingService: BankingService) {
    this.bankingService = bankingService;
  }

  async handleTransfer(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    const input = userInput.split('*');
    const currentStep = input.length;

    switch (session.currentMenu) {
      case 'transfer':
        switch (userInput) {
          case '1':
            session.currentMenu = 'transfer_1ubank_account';
            return MenuHandler.getConfirmationMessage('Enter 1UBank account number:');
          
          case '2':
            session.currentMenu = 'transfer_other_banks';
            return MenuHandler.getConfirmationMessage('Select bank:\n1. First Bank\n2. GTBank\n3. Zenith Bank\n4. Access Bank');
          
          case '3':
            session.currentMenu = 'check_transfer_limits';
            return MenuHandler.getConfirmationMessage('Enter your PIN to check transfer limits:');
          
          default:
            return MenuHandler.getErrorMessage();
        }

      case 'transfer_1ubank_account':
        session.data.recipientAccount = userInput;
        session.currentMenu = 'transfer_1ubank_amount';
        return MenuHandler.getConfirmationMessage('Enter amount:');

      case 'transfer_1ubank_amount':
        const amount = parseFloat(userInput);
        
        if (isNaN(amount) || amount <= 0) {
          return MenuHandler.getErrorMessage('Invalid amount. Please enter a valid amount.');
        }

        session.data.amount = amount;
        session.currentMenu = 'transfer_1ubank_pin';
        return MenuHandler.getConfirmationMessage(`Transfer ₦${amount.toLocaleString()} to ${session.data.recipientAccount}. Enter PIN to confirm:`);

      case 'transfer_1ubank_pin':
        const user = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!user) {
          return MenuHandler.getErrorMessage('User not found.');
        }

        const isPinValid = await this.bankingService.verifyPin(user, userInput);
        
        if (!isPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        const transferResult = await this.bankingService.transferTo1UBank(
          user,
          session.data.recipientAccount,
          session.data.amount
        );

        if (transferResult.success) {
          return MenuHandler.getSuccessMessage(`Transfer successful! ${transferResult.message}`);
        } else {
          return MenuHandler.getErrorMessage(`Transfer failed: ${transferResult.message}`);
        }

      case 'check_transfer_limits':
        const userForLimits = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!userForLimits) {
          return MenuHandler.getErrorMessage('User not found.');
        }

        const isLimitPinValid = await this.bankingService.verifyPin(userForLimits, userInput);
        
        if (!isLimitPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        return MenuHandler.getSuccessMessage(
          'Transfer Limits:\nPer Transaction: ₦50,000\nDaily: ₦300,000\nWeekly: ₦1,000,000'
        );

      default:
        return MenuHandler.getErrorMessage();
    }
  }
}