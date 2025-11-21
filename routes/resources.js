import { fetch } from '../controllers/resources.js';
import { handleErrors } from './utils.js';
import express from 'express';

const ResourcesRouter = express.Router();

ResourcesRouter.get('/', handleErrors(fetch));

export default ResourcesRouter;