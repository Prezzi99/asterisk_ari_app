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

cache.connect();

['uncaughtException', 'unhandledRejection'].forEach(event => {
    process.on(event, (stack) => {
        console.log(event + '\n', stack);
    })
});

const app = express();
const port = process.env.PORT || 7070;

app.use(cors( {origin: '*'} ));

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
}, app)

server.listen(port, () => console.log(`Listening on port >> ${port}`));