import { EventEmitter } from 'events';
import { billUser } from './utils.js';
import { wss, server, queue } from './app.js';
import cache from './redis/config.js';
import { cacheCallStatus, setCampaignIndicies, getDialerStatus } from './redis/utils.js';
import { getDetailsToContinueCampaign, createContext } from './controllers/utils.js';

const emitter = new EventEmitter();

emitter.on('bill-user', billUser);

emitter.on('call-status', async (user_id, status, sheet_index) => {
    const should_cache = (/^ringing$|^ended$/.test(status)) ? false : true;

    if (should_cache) cacheCallStatus(user_id, sheet_index, status);
    
    wss.clients.forEach(client => {
        const message = JSON.stringify({status, sheet_index});

        if (client.user == user_id) client.send(message);
    });

    const queue_new_call = (/^ended$|^no answer$|^invalid number$|^failed$/.test(status)) ? true : false;
    const dialer_status = await getDialerStatus(user_id);

    if (queue_new_call && dialer_status == 1) {
        const { script_id, numbers, caller_ids, next_lead, next_caller_id } = await getDetailsToContinueCampaign(user_id, 1);
        const context = createContext(user_id, script_id);

        if (numbers[0] === undefined) return

        emitter.emit('queue_call', { to: numbers[0], from: caller_ids[next_caller_id], context, user_id, i: next_lead });

        setCampaignIndicies(user_id, null, next_lead + 1, next_caller_id + 1, caller_ids.length);
    }
});

emitter.on('shutdown', () => {
    server.close(() => {
        console.log('Terminating Node.js process.........');
        cache.close();
        process.exit();
    })
});

emitter.on('queue_call', (details) => queue.queue(details));

export default emitter;