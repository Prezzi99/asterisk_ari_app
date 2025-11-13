import express from 'express';
import cors from 'cors';
import sheetsRouter from './routes/sheets.js';
import cache from './redis/config.js';
import ws from './asterisk/socket.js'
import dialerRouter from './routes/dialer.js';
import authRouter from './routes/auth.js';
import fileUpload from 'express-fileupload';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import { verifyToken } from './utils.js';
import { getBalance } from './database/utils.js';

cache.connect();

['uncaughtException', 'unhandledRejection'].forEach(event => {
    process.on(event, (stack) => {
        console.log(event + '\n', stack);
    })
});

const app = express();
const port = process.env.PORT || 7070;

app.use(cors( {origin: true, credentials: true} )); // TODO: Do not use {origin: true} in production.

app.use(fileUpload({
    abortOnLimit: true, 
    limits: {
        fileSize: 16 * 1024 * 1024,
        files: 1
    }
}));

app.use('/sheets', sheetsRouter);
app.use('/dialer', dialerRouter);
app.use('/auth', authRouter);

const server = createServer({
    key: readFileSync("./certs/localhost+2-key.pem"),
    cert: readFileSync("./certs/localhost+2.pem")
}, app);

export const wss = new WebSocketServer({
    server,
    clientTracking: true
});

wss.on('connection', async (socket, req) => {
   const user_id = verifyToken(req.headers.cookie);

   if (user_id === -1) return socket.close(1000, 'invalid_token');

   socket.user = user_id;

   getBalance(user_id)
   .then(balance => cache.hSet('user:balance', user_id.toString(), balance.toString()));
});

server.listen(port, () => console.log(`Listening on port >> ${port}`));