import { createClient } from 'redis';

const cache = createClient({
    socket: {
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: false
    }
})
.on('error', (error) => {
    throw new Error(error)
});

export default cache;