import pool from './config.js'

export async function saveSheet(user_id, title, file) {
    // Convert buffer to hex
    file = file.toString('hex');

    pool.query(
        `INSERT INTO sheets (user_id, title, content) VALUES (?, ?, UNHEX(?))`,
        [user_id, title, file]
    );
}

export async function getCampaignResources(user_id, sheet_id, script_id, caller_id) {
    const dataset = await pool.query(`
        SELECT content FROM sheets WHERE id = ? AND user_id = ?;
        SELECT id FROM scripts WHERE id = ? AND user_id = ?;
        SELECT phone_number, internal_name FROM dids INNER JOIN itsps ON
        itsps.id = dids.itsp_id WHERE user_id = ? AND dids.id = ?;`,
        [sheet_id, user_id, script_id, user_id, user_id, caller_id]
    );

    return {
        sheet: dataset[0][0][0]?.content,
        script_id: dataset[0][1][0]?.id,
        phone_number: dataset[0][2][0]?.phone_number,
        endpoint: dataset[0][2][0]?.internal_name
    }
}

export async function getBalance(id) {
    const [result] = await pool.query('SELECT balance FROM users WHERE id = ?', id);
    return result[0].balance
}