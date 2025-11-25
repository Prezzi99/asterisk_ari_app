import express from 'express';
import { start,  toggle, stop } from '../controllers/dialer.js';
import { handleErrors } from './utils.js';

const dialerRouter = express.Router();

dialerRouter.post('/start', handleErrors(start));
dialerRouter.post('/toggle', handleErrors(toggle));
dialerRouter.post('/stop', handleErrors(stop));

export default dialerRouter;