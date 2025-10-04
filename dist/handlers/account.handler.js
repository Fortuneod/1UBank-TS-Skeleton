"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountHandler = void 0;
const menu_handler_1 = require("./menu.handler");
class AccountHandler {
    constructor(bankingService) {
        this.bankingService = bankingService;
    }
    async handleAccountManagement(session, userInput) {
        const input = userInput.split('*');
        const currentStep = input.length;
        switch (session.currentMenu) {
            case 'account_management':
                switch (userInput) {
                    case '1':
                        session.currentMenu = 'open_account_bvn';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Please enter your BVN:');
                    case '2':
                        session.currentMenu = 'check_balance_pin';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Please enter your PIN:');
                    case '3':
                        session.currentMenu = 'mini_statement_pin';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Please enter your PIN:');
                    case '4':
                        session.currentMenu = 'reset_pin_email';
                        return menu_handler_1.MenuHandler.getConfirmationMessage('Please enter your email for OTP:');
                    default:
                        return menu_handler_1.MenuHandler.getErrorMessage();
                }
            case 'open_account_bvn':
                const bvn = userInput;
                session.data.bvn = bvn;
                const bvnVerification = await this.bankingService.verifyBVN(bvn);
                if (!bvnVerification.isValid) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid BVN. Please try again.');
                }
                session.data.bvnData = bvnVerification.data;
                session.currentMenu = 'open_account_email';
                return menu_handler_1.MenuHandler.getConfirmationMessage('BVN verified. Please enter your email:');
            case 'open_account_email':
                session.data.email = userInput;
                session.currentMenu = 'open_account_pin';
                return menu_handler_1.MenuHandler.getConfirmationMessage('Please set your transaction PIN:');
            case 'open_account_pin':
                session.data.transactionPin = userInput;
                try {
                    const user = await this.bankingService.createTier1Account(session.phoneNumber, session.data.bvn, session.data.email, session.data.transactionPin);
                    return menu_handler_1.MenuHandler.getSuccessMessage(`Account created successfully!\nAccount No: ${user.accountNumber}\nYou will receive SMS confirmation shortly.`);
                }
                catch (error) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Account creation failed. Please try again.');
                }
            case 'check_balance_pin':
                const user = await this.bankingService.verifyUser(session.phoneNumber);
                if (!user) {
                    return menu_handler_1.MenuHandler.getErrorMessage('User not found. Please open an account first.');
                }
                const isPinValid = await this.bankingService.verifyPin(user, userInput);
                if (!isPinValid) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid PIN.');
                }
                const balance = await this.bankingService.getAccountBalance(user);
                return menu_handler_1.MenuHandler.getSuccessMessage(`Your account balance: ₦${balance.toLocaleString()}`);
            case 'mini_statement_pin':
                const userForStatement = await this.bankingService.verifyUser(session.phoneNumber);
                if (!userForStatement) {
                    return menu_handler_1.MenuHandler.getErrorMessage('User not found.');
                }
                const isStatementPinValid = await this.bankingService.verifyPin(userForStatement, userInput);
                if (!isStatementPinValid) {
                    return menu_handler_1.MenuHandler.getErrorMessage('Invalid PIN.');
                }
                const miniStatement = await this.bankingService.getMiniStatement(userForStatement);
                let statementText = 'Last 5 Transactions:\n';
                miniStatement.forEach(tx => {
                    const sign = tx.amount > 0 ? '+' : '';
                    statementText += `${tx.timestamp.toLocaleDateString()}: ${sign}₦${Math.abs(tx.amount).toLocaleString()} - ${tx.description}\n`;
                });
                return menu_handler_1.MenuHandler.getSuccessMessage(statementText);
            default:
                return menu_handler_1.MenuHandler.getErrorMessage();
        }
    }
}
exports.AccountHandler = AccountHandler;
