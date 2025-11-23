import { EventEmitter } from 'events';
import { billUser } from './utils.js';
import { wss } from './app.js'

const emitter = new EventEmitter();

emitter.on('bill-user', billUser);

emitter.on('call-status', (user_id, status, sheet_index) => {
    wss.clients.forEach(client => {
        const message = JSON.stringify({status, sheet_index});

        if (client.user == user_id) client.send(message);
    });
});

export default emitter;