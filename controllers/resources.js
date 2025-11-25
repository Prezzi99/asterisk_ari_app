import pool from '../database/config.js';
import { getDialerStatus, getOngoingCampaignResources as getCampaignResources } from '../redis/utils.js';

export async function fetch(req, res) {
    const {user_id} = req.body;

    if (!/^\d+$/.test(user_id)) return res.status(400).send('')

    const [resources] = await pool.query(`
        SELECT id, title FROM sheets WHERE user_id = ? ORDER BY id DESC;
        SELECT id, phone_number FROM dids WHERE user_id = ? ORDER BY id DESC;
        SELECT id, title FROM scripts WHERE user_id = ? ORDER BY id DESC;`, 
        [user_id, user_id, user_id]
    );

    const dialer_status = await getDialerStatus(user_id);

    let ongoing_campaign;
    if (dialer_status) {
        ongoing_campaign = await getCampaignResources(user_id);
    }

    return res.status(200).json({resources, ongoing_campaign});
}