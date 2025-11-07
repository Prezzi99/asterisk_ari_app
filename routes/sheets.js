import express from 'express';
import { upload } from '../controllers/sheets.js';
import { handleErrors } from './utils.js';

const sheetsRouter = express.Router();

sheetsRouter.post('/upload', handleErrors(upload));

export default sheetsRouter;