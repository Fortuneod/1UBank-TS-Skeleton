"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USSDRouter = void 0;
// src/handlers/ussd.router.ts
const session_service_1 = require("../services/session.service");
const banking_service_1 = require("../services/banking.service");
const account_handler_1 = require("./account.handler");
const transfer_handler_1 = require("./transfer.handler");
const airtime_data_handler_1 = require("./airtime-data.handler");
const menu_handler_1 = require("./menu.handler");
class USSDRouter {
    constructor() {
        this.sessionService = new session_service_1.SessionService();
        this.bankingService = new banking_service_1.BankingService();
        this.accountHandler = new account_handler_1.AccountHandler(this.bankingService);
        this.transferHandler = new transfer_handler_1.TransferHandler(this.bankingService);
        this.airtimeDataHandler = new airtime_data_handler_1.AirtimeDataHandler(this.bankingService);
    }
    async handleRequest(ussdRequest) {
        const { sessionId, phoneNumber, text } = ussdRequest;
        let session = this.sessionService.getSession(sessionId);
        if (!session) {
            session = this.sessionService.createSession(sessionId, phoneNumber);
        }
        const userInput = text.split('*').pop() || '';
        const fullInput = text.split('*');
        const inputLength = fullInput.length;
        let response;
        try {
            if (inputLength === 1 && userInput === '') {
                // Initial request - show main menu
                response = menu_handler_1.MenuHandler.getMainMenu();
                session.currentMenu = 'main';
            }
            else {
                response = await this.routeRequest(session, userInput, fullInput);
            }
            // Update session with response data
            if (response.continueSession) {
                this.sessionService.updateSession(sessionId, session);
            }
            else {
                this.sessionService.deleteSession(sessionId);
            }
            response.sessionId = sessionId;
            return response;
        }
        catch (error) {
            console.error('USSD processing error:', error);
            this.sessionService.deleteSession(sessionId);
            return {
                sessionId,
                message: 'An error occurred. Please try again later.',
                continueSession: false
            };
        }
    }
    async routeRequest(session, userInput, fullInput) {
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
                return menu_handler_1.MenuHandler.getErrorMessage();
        }
    }
    async handleMainMenu(session, userInput) {
        switch (userInput) {
            case '1':
                session.currentMenu = 'account_management';
                session.previousMenu = 'main';
                return menu_handler_1.MenuHandler.getAccountManagementMenu();
            case '2':
                session.currentMenu = 'transfer';
                session.previousMenu = 'main';
                return menu_handler_1.MenuHandler.getTransferMenu();
            case '3':
                session.currentMenu = 'airtime_data';
                session.previousMenu = 'main';
                return menu_handler_1.MenuHandler.getAirtimeDataMenu();
            case '4':
                session.currentMenu = 'bills_payment';
                session.previousMenu = 'main';
                return menu_handler_1.MenuHandler.getBillsPaymentMenu();
            case '5':
                session.currentMenu = 'card_services';
                return menu_handler_1.MenuHandler.getSuccessMessage('Card services: Please contact customer support for card requests and management.');
            case '6':
                session.currentMenu = 'help_support';
                return menu_handler_1.MenuHandler.getSuccessMessage('Help & Support:\n1. Callback Request\n2. Submit Complaint\n3. Track Complaint\n\nPlease contact 1-800-1UBANK for assistance.');
            default:
                return menu_handler_1.MenuHandler.getErrorMessage();
        }
    }
    async handleBillsPayment(session, userInput) {
        switch (session.currentMenu) {
            case 'bills_payment':
                switch (userInput) {
                    case '1':
                        session.currentMenu = 'electricity_disco';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Select Disco:\n1. IBEDC\n2. AEDC\n3. EKEDC\n4. IKEDC');
                    case '2':
                        session.currentMenu = 'tv_provider';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Select Provider:\n1. DSTV\n2. GOtv\n3. Startimes');
                    default:
                        return menu_handler_1.MenuHandler.getErrorMessage();
                }
            case 'electricity_disco':
                const discos = ['IBEDC', 'AEDC', 'EKEDC', 'IKEDC'];
                const discoIndex = parseInt(userInput) - 1;
                if (discoIndex < 0 || discoIndex >= discos.length) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid Disco selection.');
                }
                session.data.disco = discos[discoIndex];
                session.currentMenu = 'electricity_meter';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Enter meter number:');
            case 'electricity_meter':
                session.data.meterNumber = userInput;
                session.currentMenu = 'electricity_amount';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Enter amount:');
            case 'electricity_amount':
                const amount = parseFloat(userInput);
                if (isNaN(amount) || amount <= 0) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid amount.');
                }
                session.data.amount = amount;
                session.currentMenu = 'electricity_pin';
                return menu_handler_1.MenuHandler.getConfirmationMessage(`Pay ₦${amount.toLocaleString()} for ${session.data.disco} meter ${session.data.meterNumber}. Enter PIN:`);
            case 'electricity_pin':
                // Simulate bill payment
                return menu_handler_1.MenuHandler.getSuccessMessage('Electricity bill payment successful!');
            case 'tv_provider':
                const providers = ['DSTV', 'GOtv', 'Startimes'];
                const providerIndex = parseInt(userInput) - 1;
                if (providerIndex < 0 || providerIndex >= providers.length) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid provider selection.');
                }
                session.data.provider = providers[providerIndex];
                session.currentMenu = 'tv_smartcard';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Enter smartcard number:');
            case 'tv_smartcard':
                session.data.smartcardNumber = userInput;
                session.currentMenu = 'tv_package';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Select package:\n1. Premium\n2. Compact\n3. Family\n4. Basic');
            case 'tv_package':
                const packages = ['Premium', 'Compact', 'Family', 'Basic'];
                const packageIndex = parseInt(userInput) - 1;
                if (packageIndex < 0 || packageIndex >= packages.length) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid package selection.');
                }
                session.data.package = packages[packageIndex];
                session.currentMenu = 'tv_pin';
                return menu_handler_1.MenuHandler.getConfirmationMessage(`Subscribe to ${session.data.package} package for ${session.data.provider} smartcard ${session.data.smartcardNumber}. Enter PIN:`);
            case 'tv_pin':
                // Simulate TV subscription payment
                return menu_handler_1.MenuHandler.getSuccessMessage('TV subscription successful!');
            default:
                return menu_handler_1.MenuHandler.getErrorMessage();
        }
    }
    async handleCardServices(session, userInput) {
        // Card services implementation
        return menu_handler_1.MenuHandler.getSuccessMessage('Card service request received. Customer support will contact you shortly.');
    }
    async handleHelpSupport(session, userInput) {
        // Help and support implementation
        return menu_handler_1.MenuHandler.getSuccessMessage('Support request received. We will contact you shortly.');
    }
}
exports.USSDRouter = USSDRouter;
