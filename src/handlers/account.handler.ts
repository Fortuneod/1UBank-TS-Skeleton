// src/handlers/account.handler.ts
import { BankingService } from '../services/banking.service';
import { MenuHandler } from './menu.handler';
import { USSDResponse, UserSession } from '../types/ussd.types';

export class AccountHandler {
  private bankingService: BankingService;

  constructor(bankingService: BankingService) {
    this.bankingService = bankingService;
  }

  async handleAccountManagement(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    const input = userInput.split('*');
    const currentStep = input.length;

    switch (session.currentMenu) {
      case 'account_management':
        switch (userInput) {
          case '1':
            session.currentMenu = 'open_account_bvn';
            return MenuHandler.getConfirmationMessage('Please enter your BVN:');
          
          case '2':
            session.currentMenu = 'check_balance_pin';
            return MenuHandler.getConfirmationMessage('Please enter your PIN:');
          
          case '3':
            session.currentMenu = 'mini_statement_pin';
            return MenuHandler.getConfirmationMessage('Please enter your PIN:');
          
          case '4':
            session.currentMenu = 'reset_pin_email';
            return MenuHandler.getConfirmationMessage('Please enter your email for OTP:');
          
          default:
            return MenuHandler.getErrorMessage();
        }

      case 'open_account_bvn':
        const bvn = userInput;
        session.data.bvn = bvn;
        
        const bvnVerification = await this.bankingService.verifyBVN(bvn);
        
        if (!bvnVerification.isValid) {
          return MenuHandler.getErrorMessage('Invalid BVN. Please try again.');
        }

        session.data.bvnData = bvnVerification.data;
        session.currentMenu = 'open_account_email';
        return MenuHandler.getConfirmationMessage('BVN verified. Please enter your email:');

      case 'open_account_email':
        session.data.email = userInput;
        session.currentMenu = 'open_account_pin';
        return MenuHandler.getConfirmationMessage('Please set your transaction PIN:');

      case 'open_account_pin':
        session.data.transactionPin = userInput;
        
        try {
          const user = await this.bankingService.createTier1Account(
            session.phoneNumber,
            session.data.bvn,
            session.data.email,
            session.data.transactionPin
          );

          return MenuHandler.getSuccessMessage(
            `Account created successfully!\nAccount No: ${user.accountNumber}\nYou will receive SMS confirmation shortly.`
          );
        } catch (error) {
          return MenuHandler.getErrorMessage('Account creation failed. Please try again.');
        }

      case 'check_balance_pin':
        const user = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!user) {
          return MenuHandler.getErrorMessage('User not found. Please open an account first.');
        }

        const isPinValid = await this.bankingService.verifyPin(user, userInput);
        
        if (!isPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        const balance = await this.bankingService.getAccountBalance(user);
        
        return MenuHandler.getSuccessMessage(`Your account balance: ₦${balance.toLocaleString()}`);

      case 'mini_statement_pin':
        const userForStatement = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!userForStatement) {
          return MenuHandler.getErrorMessage('User not found.');
        }

        const isStatementPinValid = await this.bankingService.verifyPin(userForStatement, userInput);
        
        if (!isStatementPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        const miniStatement = await this.bankingService.getMiniStatement(userForStatement);
        let statementText = 'Last 5 Transactions:\n';
        
        miniStatement.forEach(tx => {
          const sign = tx.amount > 0 ? '+' : '';
          statementText += `${tx.timestamp.toLocaleDateString()}: ${sign}₦${Math.abs(tx.amount).toLocaleString()} - ${tx.description}\n`;
        });

        return MenuHandler.getSuccessMessage(statementText);

      default:
        return MenuHandler.getErrorMessage();
    }
  }
}