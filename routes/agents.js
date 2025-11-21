import express from 'express';
import { handleErrors } from './utils.js';
import { add, edit, fetch } from '../controllers/agents.js';

const agentsRouter = express.Router();

agentsRouter.post('/add', handleErrors(add));
agentsRouter.get('/', handleErrors(fetch));
agentsRouter.put('/:agent_id', handleErrors(edit));

export default agentsRouter;