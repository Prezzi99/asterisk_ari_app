import pool from './config.js'

export async function saveSheet(user_id, title, file) {
    // Convert buffer to hex
    file = file.toString('hex');

    return await pool.query(
        `INSERT INTO sheets (user_id, title, content) VALUES (?, ?, UNHEX(?))`,
        [user_id, title, file]
    );
}