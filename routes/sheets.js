import express from 'express';
import { upload, fetch } from '../controllers/sheets.js';
import { handleErrors } from './utils.js';

const sheetsRouter = express.Router();

sheetsRouter.post('/upload', handleErrors(upload));
sheetsRouter.get('/', handleErrors(fetch));
sheetsRouter.get('/:sheet_id', handleErrors(fetch));

export default sheetsRouter;