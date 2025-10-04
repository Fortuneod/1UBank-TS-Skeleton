"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const ussd_router_1 = require("./handlers/ussd.router");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const ussdRouter = new ussd_router_1.USSDRouter();
app.post('/ussd', async (req, res) => {
    try {
        const { sessionId, phoneNumber, serviceCode, text, networkCode } = req.body;
        const ussdRequest = {
            sessionId,
            phoneNumber,
            serviceCode,
            text,
            networkCode
        };
        const response = await ussdRouter.handleRequest(ussdRequest);
        res.json(response);
    }
    catch (error) {
        console.error('USSD endpoint error:', error);
        res.status(500).json({
            sessionId: req.body.sessionId,
            message: 'Service temporarily unavailable. Please try again later.',
            continueSession: false
        });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(port, () => {
    console.log(`1UBank USSD Application running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`USSD endpoint: POST http://localhost:${port}/ussd`);
});
