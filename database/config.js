import { createPool } from 'mysql2';
import { config } from 'dotenv';

config({path: './config.env'});

const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
}).promise();

export default pool;