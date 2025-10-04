// src/handlers/airtime-data.handler.ts
import { BankingService } from '../services/banking.service';
import { MenuHandler } from './menu.handler';
import { USSDResponse, UserSession } from '../types/ussd.types';

export class AirtimeDataHandler {
  private bankingService: BankingService;

  constructor(bankingService: BankingService) {
    this.bankingService = bankingService;
  }

  async handleAirtimeData(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    switch (session.currentMenu) {
      case 'airtime_data':
        switch (userInput) {
          case '1':
            session.currentMenu = 'airtime_self_amount';
            return MenuHandler.getConfirmationMessage('Enter amount for airtime:');
          
          case '2':
            session.currentMenu = 'airtime_others_network';
            return MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
          
          case '3':
            session.currentMenu = 'data_self_network';
            return MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
          
          case '4':
            session.currentMenu = 'data_others_network';
            return MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
          
          default:
            return MenuHandler.getErrorMessage();
        }

      case 'airtime_self_amount':
        const amount = parseFloat(userInput);
        
        if (isNaN(amount) || amount <= 0) {
          return MenuHandler.getErrorMessage('Invalid amount.');
        }

        session.data.amount = amount;
        session.currentMenu = 'airtime_self_pin';
        return MenuHandler.getConfirmationMessage(`Buy ₦${amount.toLocaleString()} airtime for self. Enter PIN:`);

      case 'airtime_self_pin':
        const user = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!user) {
          return MenuHandler.getErrorMessage('User not found.');
        }

        const isPinValid = await this.bankingService.verifyPin(user, userInput);
        
        if (!isPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        const airtimeResult = await this.bankingService.buyAirtime(
          user,
          session.phoneNumber,
          session.data.amount
        );

        if (airtimeResult.success) {
          return MenuHandler.getSuccessMessage(`Airtime purchase successful! ${airtimeResult.message}`);
        } else {
          return MenuHandler.getErrorMessage(`Airtime purchase failed: ${airtimeResult.message}`);
        }

      case 'airtime_others_network':
        const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
        const networkIndex = parseInt(userInput) - 1;
        
        if (networkIndex < 0 || networkIndex >= networks.length) {
          return MenuHandler.getErrorMessage('Invalid network selection.');
        }

        session.data.network = networks[networkIndex];
        session.currentMenu = 'airtime_others_phone';
        return MenuHandler.getConfirmationMessage('Enter phone number:');

      case 'airtime_others_phone':
        const phoneNumber = userInput;
        
        if (!/^0[7-9][0-9]{9}$/.test(phoneNumber)) {
          return MenuHandler.getErrorMessage('Invalid phone number.');
        }

        session.data.recipientPhone = phoneNumber;
        session.currentMenu = 'airtime_others_amount';
        return MenuHandler.getConfirmationMessage('Enter amount:');

      case 'airtime_others_amount':
        const othersAmount = parseFloat(userInput);
        
        if (isNaN(othersAmount) || othersAmount <= 0) {
          return MenuHandler.getErrorMessage('Invalid amount.');
        }

        session.data.amount = othersAmount;
        session.currentMenu = 'airtime_others_pin';
        return MenuHandler.getConfirmationMessage(
          `Buy ₦${othersAmount.toLocaleString()} ${session.data.network} airtime for ${session.data.recipientPhone}. Enter PIN:`
        );

      case 'airtime_others_pin':
        const userForOthers = await this.bankingService.verifyUser(session.phoneNumber);
        
        if (!userForOthers) {
          return MenuHandler.getErrorMessage('User not found.');
        }

        const isOthersPinValid = await this.bankingService.verifyPin(userForOthers, userInput);
        
        if (!isOthersPinValid) {
          return MenuHandler.getErrorMessage('Invalid PIN.');
        }

        const othersAirtimeResult = await this.bankingService.buyAirtime(
          userForOthers,
          session.data.recipientPhone,
          session.data.amount
        );

        if (othersAirtimeResult.success) {
          return MenuHandler.getSuccessMessage(`Airtime purchase successful! ${othersAirtimeResult.message}`);
        } else {
          return MenuHandler.getErrorMessage(`Airtime purchase failed: ${othersAirtimeResult.message}`);
        }

      default:
        return MenuHandler.getErrorMessage();
    }
  }
}