import { WebSocket } from 'ws';
import { config } from 'dotenv';
import { getChannelDetails, setChannelAnswered, setChannelEnded } from '../redis/utils.js';
import events from '../events.js';

config({path: './config.env'});

const key = process.env.ARI_USERNAME + ':' + process.env.ARI_PASSWORD;
const host = process.env.ARI_HOST;
const app = process.env.ARI_APP;

const ws = new WebSocket(`ws://${host}/ari/events?api_key=${key}&app=${app}`);

ws.on('open', () => console.log('You are connected.'));

ws.on('message', async (event) => {
    event = JSON.parse(event.toString());
    
    if (
        ['ChannelDestroyed', 'ChannelStateChange'].includes(event.type)
    ) {
        const { id, state } = event.channel;
        const timestamp = event.timestamp;

        switch (event.type) {
            case 'ChannelStateChange':
                if (state === 'Up') {
                    setChannelAnswered(id, timestamp);

                    const { user:user_id, to:callee } = await getChannelDetails(id);
                    events.emit('call-status', user_id, 'answered', callee);
                }
                else if (state === 'Ringing') {
                    const { user:user_id, to:callee } = await getChannelDetails(id);
                    events.emit('call-status', user_id, 'ringing', callee);
                }
                break
            case 'ChannelDestroyed':
                setChannelEnded(id, timestamp);

                // TODO: Bill the user for the channel
                const channel = await getChannelDetails(id);

                events.emit('bill-user', channel.user, channel.answered || timestamp, timestamp);
                events.emit('call-status', channel.user, 'ended', channel.to)
                break
        }
    }
});

export default ws;