import { WebSocket } from 'ws';
import { config } from 'dotenv';

config({path: './config.env'});

const key = process.env.ARI_USERNAME + ':' + process.env.ARI_PASSWORD;
const host = process.env.ARI_HOST;
const app = process.env.ARI_APP;

const ws = new WebSocket(`ws://${host}/ari/events?api_key=${key}&app=${app}`);

ws.on('open', () => console.log('You are connected.'));

ws.on('message', async (message) => {
    message = JSON.parse(message.toString());
    console.log(message);
});

export default ws;