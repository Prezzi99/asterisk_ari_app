import { EventEmitter } from 'events';
import { billUser } from './utils.js';

const emitter = new EventEmitter();

emitter.on('bill-user', billUser);

export default emitter;