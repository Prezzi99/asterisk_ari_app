import pool from '../database/config.js';

export async function fetch(req, res) {
    const {user_id} = req.body;

    if (!/^\d+$/.test(user_id)) return res.status(400).send('')

    const [resources] = await pool.query(`
        SELECT id, title FROM sheets WHERE user_id = ? ORDER BY id DESC;
        SELECT id, phone_number FROM dids WHERE user_id = ? ORDER BY id DESC;
        SELECT id, title FROM scripts WHERE user_id = ? ORDER BY id DESC;`, 
        [user_id, user_id, user_id]
    );

    return res.status(200).json(resources);
}