import pool from './config.js'

export async function saveSheet(user_id, title, file) {
    // Convert buffer to hex
    file = file.toString('hex');

    pool.query(
        `INSERT INTO sheets (user_id, title, content) VALUES (?, ?, UNHEX(?))`,
        [user_id, title, file]
    );
}

export async function getCampaignResources(user_id, sheet_id, script_id) {
    const dataset = await pool.query(`
        SELECT content FROM sheets WHERE id = ? AND user_id = ?;
        SELECT id FROM scripts WHERE id = ? AND user_id = ?;
        SELECT JSON_ARRAYAGG(phone_number) as caller_ids
        FROM dids WHERE user_id = ?;`,
        [sheet_id, user_id, script_id, user_id, user_id]
    );

    return {
        sheet: dataset[0][0][0]?.content,
        script_id: dataset[0][1][0]?.id,
        caller_ids: dataset[0][2][0]?.caller_ids,
    }
}

export async function getBalance(id) {
    const [result] = await pool.query('SELECT balance FROM users WHERE id = ?', id);
    return result[0].balance
}

export async function getRate(id) {
    const [result] = await pool.query('SELECT rate from calling_rates_per_min WHERE id = ?', id)
    return result[0].rate;
}

export async function getSheetContent(sheet_id, user_id) {
    const [result] = await pool.query('SELECT content FROM sheets WHERE id = ? AND user_id = ?', [sheet_id, user_id])
    return result[0]?.content
}

export async function getSheets(user_id) {
    const [result] = await pool.query('SELECT id, title FROM sheets WHERE user_id = ? ORDER BY id DESC',user_id)
    return result
}

export async function getEndpoints() {
    const [[ endpoints ]] = await pool.query(
        'SELECT JSON_ARRAYAGG(internal_name) AS names FROM itsps'
    )

    return endpoints.names
}

export async function getScripts(user_id) {
    const [result] = await pool.query('SELECT id, title FROM scripts WHERE user_id = ? ORDER BY id DESC', user_id)
    return result
}

export async function getScriptAudio(script_id, user_id) {
    const [result] = await pool.query('SELECT audio FROM scripts WHERE id = ? AND user_id = ?', [script_id, user_id]);
    return result[0]?.audio
}

export async function getAgentsPhoneNumbers(user_id) {
    const [numbers] = await pool.query(
        'SELECT JSON_ARRAYAGG(phone_number) AS numbers FROM agents WHERE user_id = ?', 
        user_id
    );

    return numbers[0].numbers
}