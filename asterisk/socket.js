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

                    const { user:user_id, sheet_index} = await getChannelDetails(id);
                    events.emit('call-status', user_id, 'answered', sheet_index);
                }
                else if (state === 'Ringing') {
                    const { user:user_id, sheet_index} = await getChannelDetails(id);
                    events.emit('call-status', user_id, 'ringing', sheet_index);
                }
                break
            case 'ChannelDestroyed':
                setChannelEnded(id, timestamp);

                // TODO: Bill the user for the channel
                const channel = await getChannelDetails(id);

                events.emit('bill-user', channel.user, channel.answered || timestamp, timestamp);

                const status = (channel.answered) ? 'ended' : 'no answer';
                events.emit('call-status', channel.user, status, channel.sheet_index);
                break
        }
    }
});

ws.on('close', async () => console.log('ARI socket closed.'));

export default ws;