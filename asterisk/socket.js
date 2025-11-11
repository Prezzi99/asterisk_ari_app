import { WebSocket } from 'ws';
import { config } from 'dotenv';
import { setChannelAnswered, setChannelEnded } from '../redis/utils.js';

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
            if (state === 'Up') setChannelAnswered(id, timestamp)
            break
        case 'ChannelDestroyed':
            setChannelEnded(id, timestamp);
            break
        }
    }
});

export default ws;