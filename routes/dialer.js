import express from 'express';
import { start } from '../controllers/dialer.js';
import { handleErrors } from './utils.js';

const dialerRouter = express.Router();

dialerRouter.post('/start', handleErrors(start));

export default dialerRouter;