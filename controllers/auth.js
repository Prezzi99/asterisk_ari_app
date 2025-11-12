
import pool from '../database/config.js'
import { hash, compare, sign } from './utils.js'
import { testRegExp } from './utils.js';

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send('');

    const [[user]] = await pool.query('SELECT id, email, password FROM users WHERE email = ?', email);

    if (user?.id === undefined || !await compare(password, user.password)) {
        return res.status(401).send('incorrect_credentials');
    }

    res.cookie('b_earer_token', sign(user.id), {
            httpOnly: true,
            sameSite: 'none',
            secure: true
    });

    return res.status(200).send();
}

export async function signup(req, res) {
    const { first_name, last_name, email, password, phone } = req.body;

    const pairs = [
        [/^(?!undefined)[a-zA-Z]{1,50}/, [first_name, last_name]],
        [/^(?!undefined).{12,255}/, [password]],
        [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]+$/, [email]],
        [/^1\d{10}$/, [phone]]
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    const [[user]] = await pool.query('SELECT id FROM users WHERE email = ?', email);

    if (user?.id) return res.status(409).send('user_exists');

    pool.query(
        'INSERT INTO users (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
        [first_name, last_name, email, await hash(password), phone]
    );

    return res.status(201).send('');
}