import { EventEmitter } from 'events';
import { billUser } from './utils.js';
import { wss, server } from './app.js';
import cache from './redis/config.js';
import { cacheCallStatus } from './redis/utils.js';

const emitter = new EventEmitter();

emitter.on('bill-user', billUser);

emitter.on('call-status', (user_id, status, sheet_index) => {
    const should_cache = (/^ringing$|^ended$/.test(status)) ? false : true;

    if (should_cache) cacheCallStatus(user_id, status);
    
    wss.clients.forEach(client => {
        const message = JSON.stringify({status, sheet_index});

        if (client.user == user_id) client.send(message);
    });
});

emitter.on('shutdown', () => {
    server.close(() => {
        console.log('Terminating Node.js process.........');
        cache.close();
        process.exit();
    })
});

export default emitter;