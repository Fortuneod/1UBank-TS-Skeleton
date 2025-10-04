"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtimeDataHandler = void 0;
const menu_handler_1 = require("./menu.handler");
class AirtimeDataHandler {
    constructor(bankingService) {
        this.bankingService = bankingService;
    }
    async handleAirtimeData(session, userInput) {
        switch (session.currentMenu) {
            case 'airtime_data':
                switch (userInput) {
                    case '1':
                        session.currentMenu = 'airtime_self_amount';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Enter amount for airtime:');
                    case '2':
                        session.currentMenu = 'airtime_others_network';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
                    case '3':
                        session.currentMenu = 'data_self_network';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
                    case '4':
                        session.currentMenu = 'data_others_network';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Select network:\n1. MTN\n2. Airtel\n3. Glo\n4. 9mobile');
                    default:
                        return menu_handler_1.MenuHandler.getErrorMessage();
                }
            case 'airtime_self_amount':
                const amount = parseFloat(userInput);
                if (isNaN(amount) || amount <= 0) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid amount.');
                }
                session.data.amount = amount;
                session.currentMenu = 'airtime_self_pin';
                return menu_handler_1.MenuHandler.getConfirmationMessage(`Buy ₦${amount.toLocaleString()} airtime for self. Enter PIN:`);
            case 'airtime_self_pin':
                const user = await this.bankingService.verifyUser(session.phoneNumber);
                if (!user) {
                    return menu_handler_1.MenuHandler.getErrorMessage('User not found.');
                }
                const isPinValid = await this.bankingService.verifyPin(user, userInput);
                if (!isPinValid) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid PIN.');
                }
                const airtimeResult = await this.bankingService.buyAirtime(user, session.phoneNumber, session.data.amount);
                if (airtimeResult.success) {
                    return menu_handler_1.MenuHandler.getSuccessMessage(`Airtime purchase successful! ${airtimeResult.message}`);
                }
                else {
                    return menu_handler_1.MenuHandler.getErrorMessage(`Airtime purchase failed: ${airtimeResult.message}`);
                }
            case 'airtime_others_network':
                const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
                const networkIndex = parseInt(userInput) - 1;
                if (networkIndex < 0 || networkIndex >= networks.length) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid network selection.');
                }
                session.data.network = networks[networkIndex];
                session.currentMenu = 'airtime_others_phone';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Enter phone number:');
            case 'airtime_others_phone':
                const phoneNumber = userInput;
                if (!/^0[7-9][0-9]{9}$/.test(phoneNumber)) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid phone number.');
                }
                session.data.recipientPhone = phoneNumber;
                session.currentMenu = 'airtime_others_amount';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Enter amount:');
            case 'airtime_others_amount':
                const othersAmount = parseFloat(userInput);
                if (isNaN(othersAmount) || othersAmount <= 0) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid amount.');
                }
                session.data.amount = othersAmount;
                session.currentMenu = 'airtime_others_pin';
                return menu_handler_1.MenuHandler.getConfirmationMessage(`Buy ₦${othersAmount.toLocaleString()} ${session.data.network} airtime for ${session.data.recipientPhone}. Enter PIN:`);
            case 'airtime_others_pin':
                const userForOthers = await this.bankingService.verifyUser(session.phoneNumber);
                if (!userForOthers) {
                    return menu_handler_1.MenuHandler.getErrorMessage('User not found.');
                }
                const isOthersPinValid = await this.bankingService.verifyPin(userForOthers, userInput);
                if (!isOthersPinValid) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid PIN.');
                }
                const othersAirtimeResult = await this.bankingService.buyAirtime(userForOthers, session.data.recipientPhone, session.data.amount);
                if (othersAirtimeResult.success) {
                    return menu_handler_1.MenuHandler.getSuccessMessage(`Airtime purchase successful! ${othersAirtimeResult.message}`);
                }
                else {
                    return menu_handler_1.MenuHandler.getErrorMessage(`Airtime purchase failed: ${othersAirtimeResult.message}`);
                }
            default:
                return menu_handler_1.MenuHandler.getErrorMessage();
        }
    }
}
exports.AirtimeDataHandler = AirtimeDataHandler;
