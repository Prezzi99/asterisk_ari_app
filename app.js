import express from 'express';
import cors from 'cors';
import sheetsRouter from './routes/sheets.js';
import cache from './redis/config.js';
import ws from './asterisk/socket.js'
import dialerRouter from './routes/dialer.js';
import authRouter from './routes/auth.js';
import agentsRouter from './routes/agents.js';
import ResourcesRouter from './routes/resources.js';
import fileUpload from 'express-fileupload';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import { verifyToken } from './utils.js';
import { getBalance } from './database/utils.js';
import { getRate } from './database/utils.js';
import { authGuard } from './middleware/gaurd.js';
import { setDialerStatus, getDialerStatus } from './redis/utils.js';

cache.connect();

getRate(process.env.CALLING_RATE_ID || 1)
.then(rate => process.env.RATE_PER_MIN = rate);

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

app.use(express.json());

app.use('/auth', authRouter);
app.use(authGuard);
app.use('/sheets', sheetsRouter);
app.use('/dialer', dialerRouter);
app.use('/agents', agentsRouter);
app.use('/resources', ResourcesRouter);

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

   socket.on('close', () => {
      getDialerStatus(socket.user)
      .then(status => {
        if (status == 1) setDialerStatus(socket.user, -1);
      })
   })
});

server.listen(port, () => console.log(`Listening on port >> ${port}`));