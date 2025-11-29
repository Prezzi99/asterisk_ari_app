import express from 'express';
import { fetch } from '../controllers/scripts.js';
import { handleErrors } from './utils.js';

const scriptsRouter = express.Router();

scriptsRouter.get('/', handleErrors(fetch));
scriptsRouter.get('/:script_id', handleErrors(fetch));

export default scriptsRouter;