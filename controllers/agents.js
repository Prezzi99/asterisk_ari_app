import { testRegExp } from './utils.js';
import pool from '../database/config.js';

export async function add(req, res) {
    const { user_id, full_name, phone_number } = req.body;

    const pairs = [
        [/^[a-zA-z-\s]{1,100}$/, [full_name]],
        [/^\d{11}$/, [phone_number]],
        [/^\d+$/, [user_id]]
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    pool.query(
        'INSERT INTO agents (user_id, full_name, phone_number) VALUES (?, ?, ?)',
        [user_id, full_name, phone_number]
    )
    .then(result => res.status(201).send('agent_added.'))
    .catch(err => {
        if (err.errno == 1644 || err.errno == 1062) return res.status(409).send('')
        
        return res.status(500).send('caught_a_bug');
    });
}

export async function fetch(req, res) {
    const { user_id } = req.body;

    if (!/^\d+$/.test(user_id)) return res.status(400).send('')

    const [agents] = await pool.query(
        'SELECT id, full_name, phone_number FROM agents WHERE user_id = ?', 
        user_id
    );
    
    return res.status(200).json(agents)
}

export async function edit(req, res) {
    const { user_id, full_name, phone_number } = req.body;
    const { agent_id } = req.params;

    const pairs = [
        [/^[a-zA-z-\s]{1,100}$/, [full_name]],
        [/^\d{11}$/, [phone_number]],
        [/^\d+$/, [user_id, agent_id]]
    ];

    if (!testRegExp(pairs)) return res.status(400).send('')
    
    pool.query(
        'UPDATE agents SET full_name = ?, phone_number = ? WHERE id = ? AND user_id = ?',
        [full_name, phone_number, agent_id, user_id]
    );

    return res.status(200).send('');
}