// src/handlers/menu.handler.ts
import { USSDResponse, UserSession } from '../types/ussd.types';

export class MenuHandler {
  static getMainMenu(): USSDResponse {
    const message = `Welcome to 1UBank\n
1. Account Management
2. Transfer
3. Airtime & Data
4. Bills Payment
5. Card Services
6. Help & Support`;

    return {
      sessionId: '',
      message,
      continueSession: true
    };
  }

  static getAccountManagementMenu(): USSDResponse {
    const message = `Account Management\n
1. Open An Account (Tier 1)
2. Check Account Balance
3. Mini Statement (Last 5)
4. Change/Reset PIN`;

    return {
      sessionId: '',
      message,
      continueSession: true
    };
  }

  static getTransferMenu(): USSDResponse {
    const message = `Transfer\n
1. To 1UBank Account
2. To Other Banks
3. Check Transfer Limits`;

    return {
      sessionId: '',
      message,
      continueSession: true
    };
  }

  static getAirtimeDataMenu(): USSDResponse {
    const message = `Airtime & Data\n
1. Airtime for Self
2. Airtime for Others
3. Data for Self
4. Data for Others`;

    return {
      sessionId: '',
      message,
      continueSession: true
    };
  }

  static getBillsPaymentMenu(): USSDResponse {
    const message = `Bills Payment\n
1. Electricity
2. TV Subscription`;

    return {
      sessionId: '',
      message,
      continueSession: true
    };
  }

  static getErrorMessage(message: string = 'Invalid input. Please try again.'): USSDResponse {
    return {
      sessionId: '',
      message,
      continueSession: false
    };
  }

  static getSuccessMessage(message: string): USSDResponse {
    return {
      sessionId: '',
      message,
      continueSession: false
    };
  }

  static getConfirmationMessage(prompt: string): USSDResponse {
    return {
      sessionId: '',
      message: prompt,
      continueSession: true
    };
  }
}