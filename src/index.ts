// src/index.ts
import express from 'express';
import bodyParser from 'body-parser';
import { USSDRouter } from './handlers/ussd.router';
import { USSDRequest } from './types/ussd.types';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const ussdRouter = new USSDRouter();

app.post('/ussd', async (req, res) => {
  try {
    const { sessionId, phoneNumber, serviceCode, text, networkCode } = req.body;

    const ussdRequest: USSDRequest = {
      sessionId,
      phoneNumber,
      serviceCode,
      text,
      networkCode
    };

    const response = await ussdRouter.handleRequest(ussdRequest);

    res.json(response);
  } catch (error) {
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