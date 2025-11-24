import express from 'express';
import { start,  toggle } from '../controllers/dialer.js';
import { handleErrors } from './utils.js';

const dialerRouter = express.Router();

dialerRouter.post('/start', handleErrors(start));
dialerRouter.post('/toggle', handleErrors(toggle));

export default dialerRouter;