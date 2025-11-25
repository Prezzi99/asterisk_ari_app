import { createClient } from 'redis';
import events from '../events.js';

const cache = createClient({
    socket: {
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: false
    }
})
.on('error', (error) => {
    events.emit('shutdown');
    throw new Error(error);
})
.on('end', () => events.emit('shutdown'));

export default cache;