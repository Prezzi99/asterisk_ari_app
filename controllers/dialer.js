import { getCampaignResources } from "../database/utils.js";
import { createContext, testRegExp } from "./utils.js";
import * as xlsx from 'xlsx';
import { cacheCampaignResources, getDialerStatus, setDialerStatus, dumpCampaignResources } from '../redis/utils.js';
import events from '../events.js'

const concurrency = +process.env.CONCURRENT_CALLS;

export async function start(req, res) {
    const { user_id, sheet_id, script_id } = req.body;
    const start = +req.body.start || 0;
    
    const pairs = [
        [/^\d+$/, [user_id, start, sheet_id, script_id]],
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    const dialer_status = await getDialerStatus(user_id);
    if (dialer_status == 1 || dialer_status == -1) return res.status(409).send('dialer_already_on.');

    let caller_ids, numbers;

    await getCampaignResources(user_id, sheet_id, script_id)
    .then(async result => {
        if (!result.sheet || result.script_id != script_id) return
        const workbook = xlsx.read(result.sheet, {
            raw: true,
            type: 'buffer',
            cellFormula: false
        });

        caller_ids = result.caller_ids;

        const sheet_as_json = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { blankrows: false, defval: '' });
        numbers = sheet_as_json.map(row => row['Telephone']);
    });

    if (!caller_ids.length || !numbers.length) return res.status(404).send('missing_script_caller_id_or_phone_numbers.');

    const context = createContext(user_id, script_id);
   
    for (let i = start, j = 0; i < concurrency + start; i++, j++) {
        if (numbers[i] === undefined) continue
        events.emit('queue_call', { to: numbers[i], from: caller_ids[j], context, user_id, i });
    }

    setDialerStatus(user_id, 1);

    cacheCampaignResources(user_id, numbers, script_id, sheet_id);

    return res.status(200).send('dialer_initialized.');
}

export async function toggle(req, res) {
    const { user_id } = req.body;
    
    const pairs = [
        [/^\d+$/, [user_id]],
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    const dialer_status = await getDialerStatus(user_id);

    if (dialer_status) {
        setDialerStatus(user_id, -(dialer_status));

        const note =  (-(dialer_status) === 1) ? 'dialer_resumed' : 'dialer_paused';
        return res.status(200).send(note);
    }
    
    return res.status(409).send('dialer_not_on.');
}

export async function stop(req, res) {
    const { user_id } = req.body;
    
    const pairs = [
        [/^\d+$/, [user_id]],
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    dumpCampaignResources(user_id);

    return res.status(200).send('dialer_stopped.')
}