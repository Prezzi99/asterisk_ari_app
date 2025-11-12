import { login, signup } from '../controllers/auth.js';
import express from 'express';
import { handleErrors } from './utils.js'

const authRouter = express.Router();

authRouter.post('/login', handleErrors(login));
authRouter.post('/signup', handleErrors(signup));

export default authRouter;