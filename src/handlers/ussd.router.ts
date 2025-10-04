// src/handlers/ussd.router.ts
import { SessionService } from '../services/session.service';
import { BankingService } from '../services/banking.service';
import { AccountHandler } from './account.handler';
import { TransferHandler } from './transfer.handler';
import { AirtimeDataHandler } from './airtime-data.handler';
import { MenuHandler } from './menu.handler';
import { USSDRequest, USSDResponse } from '../types/ussd.types';
import { UserSession } from '../types/ussd.types';

export class USSDRouter {
  private sessionService: SessionService;
  private bankingService: BankingService;
  private accountHandler: AccountHandler;
  private transferHandler: TransferHandler;
  private airtimeDataHandler: AirtimeDataHandler;

  constructor() {
    this.sessionService = new SessionService();
    this.bankingService = new BankingService();
    this.accountHandler = new AccountHandler(this.bankingService);
    this.transferHandler = new TransferHandler(this.bankingService);
    this.airtimeDataHandler = new AirtimeDataHandler(this.bankingService);
  }

  async handleRequest(ussdRequest: USSDRequest): Promise<USSDResponse> {
    const { sessionId, phoneNumber, text } = ussdRequest;
    
    let session = this.sessionService.getSession(sessionId);
    
    if (!session) {
      session = this.sessionService.createSession(sessionId, phoneNumber);
    }

    const userInput = text.split('*').pop() || '';
    const fullInput = text.split('*');
    const inputLength = fullInput.length;

    let response: USSDResponse;

    try {
      if (inputLength === 1 && userInput === '') {
        // Initial request - show main menu
        response = MenuHandler.getMainMenu();
        session.currentMenu = 'main';
      } else {
        response = await this.routeRequest(session, userInput, fullInput);
      }

      // Update session with response data
      if (response.continueSession) {
        this.sessionService.updateSession(sessionId, session);
      } else {
        this.sessionService.deleteSession(sessionId);
      }

      response.sessionId = sessionId;
      return response;
    } catch (error) {
      console.error('USSD processing error:', error);
      
      this.sessionService.deleteSession(sessionId);
      
      return {
        sessionId,
        message: 'An error occurred. Please try again later.',
        continueSession: false
      };
    }
  }

  private async routeRequest(
    session: UserSession,
    userInput: string,
    fullInput: string[]
  ): Promise<USSDResponse> {
    switch (session.currentMenu) {
      case 'main':
        return this.handleMainMenu(session, userInput);
      
      case 'account_management':
      case 'open_account_bvn':
      case 'open_account_email':
      case 'open_account_pin':
      case 'check_balance_pin':
      case 'mini_statement_pin':
      case 'reset_pin_email':
        return this.accountHandler.handleAccountManagement(session, userInput);
      
      case 'transfer':
      case 'transfer_1ubank_account':
      case 'transfer_1ubank_amount':
      case 'transfer_1ubank_pin':
      case 'transfer_other_banks':
      case 'check_transfer_limits':
        return this.transferHandler.handleTransfer(session, userInput);
      
      case 'airtime_data':
      case 'airtime_self_amount':
      case 'airtime_self_pin':
      case 'airtime_others_network':
      case 'airtime_others_phone':
      case 'airtime_others_amount':
      case 'airtime_others_pin':
      case 'data_self_network':
      case 'data_others_network':
        return this.airtimeDataHandler.handleAirtimeData(session, userInput);
      
      case 'bills_payment':
        return this.handleBillsPayment(session, userInput);
      
      case 'card_services':
        return this.handleCardServices(session, userInput);
      
      case 'help_support':
        return this.handleHelpSupport(session, userInput);
      
      default:
        return MenuHandler.getErrorMessage();
    }
  }

  private async handleMainMenu(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    switch (userInput) {
      case '1':
        session.currentMenu = 'account_management';
        session.previousMenu = 'main';
        return MenuHandler.getAccountManagementMenu();
      
      case '2':
        session.currentMenu = 'transfer';
        session.previousMenu = 'main';
        return MenuHandler.getTransferMenu();
      
      case '3':
        session.currentMenu = 'airtime_data';
        session.previousMenu = 'main';
        return MenuHandler.getAirtimeDataMenu();
      
      case '4':
        session.currentMenu = 'bills_payment';
        session.previousMenu = 'main';
        return MenuHandler.getBillsPaymentMenu();
      
      case '5':
        session.currentMenu = 'card_services';
        return MenuHandler.getSuccessMessage('Card services: Please contact customer support for card requests and management.');
      
      case '6':
        session.currentMenu = 'help_support';
        return MenuHandler.getSuccessMessage('Help & Support:\n1. Callback Request\n2. Submit Complaint\n3. Track Complaint\n\nPlease contact 1-800-1UBANK for assistance.');
      
      default:
        return MenuHandler.getErrorMessage();
    }
  }

  private async handleBillsPayment(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    switch (session.currentMenu) {
      case 'bills_payment':
        switch (userInput) {
          case '1':
            session.currentMenu = 'electricity_disco';
            return MenuHandler.getConfirmationMessage('Select Disco:\n1. IBEDC\n2. AEDC\n3. EKEDC\n4. IKEDC');
          
          case '2':
            session.currentMenu = 'tv_provider';
            return MenuHandler.getConfirmationMessage('Select Provider:\n1. DSTV\n2. GOtv\n3. Startimes');
          
          default:
            return MenuHandler.getErrorMessage();
        }
      
      case 'electricity_disco':
        const discos = ['IBEDC', 'AEDC', 'EKEDC', 'IKEDC'];
        const discoIndex = parseInt(userInput) - 1;
        
        if (discoIndex < 0 || discoIndex >= discos.length) {
          return MenuHandler.getErrorMessage('Invalid Disco selection.');
        }

        session.data.disco = discos[discoIndex];
        session.currentMenu = 'electricity_meter';
        return MenuHandler.getConfirmationMessage('Enter meter number:');
      
      case 'electricity_meter':
        session.data.meterNumber = userInput;
        session.currentMenu = 'electricity_amount';
        return MenuHandler.getConfirmationMessage('Enter amount:');
      
      case 'electricity_amount':
        const amount = parseFloat(userInput);
        
        if (isNaN(amount) || amount <= 0) {
          return MenuHandler.getErrorMessage('Invalid amount.');
        }

        session.data.amount = amount;
        session.currentMenu = 'electricity_pin';
        return MenuHandler.getConfirmationMessage(
          `Pay ₦${amount.toLocaleString()} for ${session.data.disco} meter ${session.data.meterNumber}. Enter PIN:`
        );
      
      case 'electricity_pin':
        // Simulate bill payment
        return MenuHandler.getSuccessMessage('Electricity bill payment successful!');
      
      case 'tv_provider':
        const providers = ['DSTV', 'GOtv', 'Startimes'];
        const providerIndex = parseInt(userInput) - 1;
        
        if (providerIndex < 0 || providerIndex >= providers.length) {
          return MenuHandler.getErrorMessage('Invalid provider selection.');
        }

        session.data.provider = providers[providerIndex];
        session.currentMenu = 'tv_smartcard';
        return MenuHandler.getConfirmationMessage('Enter smartcard number:');
      
      case 'tv_smartcard':
        session.data.smartcardNumber = userInput;
        session.currentMenu = 'tv_package';
        return MenuHandler.getConfirmationMessage('Select package:\n1. Premium\n2. Compact\n3. Family\n4. Basic');
      
      case 'tv_package':
        const packages = ['Premium', 'Compact', 'Family', 'Basic'];
        const packageIndex = parseInt(userInput) - 1;
        
        if (packageIndex < 0 || packageIndex >= packages.length) {
          return MenuHandler.getErrorMessage('Invalid package selection.');
        }

        session.data.package = packages[packageIndex];
        session.currentMenu = 'tv_pin';
        return MenuHandler.getConfirmationMessage(
          `Subscribe to ${session.data.package} package for ${session.data.provider} smartcard ${session.data.smartcardNumber}. Enter PIN:`
        );
      
      case 'tv_pin':
        // Simulate TV subscription payment
        return MenuHandler.getSuccessMessage('TV subscription successful!');
      
      default:
        return MenuHandler.getErrorMessage();
    }
  }

  private async handleCardServices(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    // Card services implementation
    return MenuHandler.getSuccessMessage('Card service request received. Customer support will contact you shortly.');
  }

  private async handleHelpSupport(
    session: UserSession,
    userInput: string
  ): Promise<USSDResponse> {
    // Help and support implementation
    return MenuHandler.getSuccessMessage('Support request received. We will contact you shortly.');
  }
}