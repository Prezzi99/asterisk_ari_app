import { getCampaignResources } from "../database/utils.js";
import { originate } from '../asterisk/utils.js';
import { createContext, testRegExp } from "./utils.js";
import * as xlsx from 'xlsx';
import { cacheChannelDetails, cacheCampaignResources, getDialerStatus, setDialerStatus } from '../redis/utils.js';

const concurrency = +process.env.CONCURRENT_CALLS;

export async function start(req, res) {
    const { user_id, sheet_id, script_id, caller_id } = req.body;
    const start = +req.body.start || 0;
    
    const pairs = [
        [/^\d+$/, [user_id, start, sheet_id, script_id, caller_id]],
    ];

    if (!testRegExp(pairs)) return res.status(400).send('');

    const dialer_status = await getDialerStatus(user_id);
    if (dialer_status == 1 || dialer_status == -1) return res.status(409).send('dialer_already_on.');

    let from, numbers, endpoint;

    await getCampaignResources(user_id, sheet_id, script_id, caller_id)
    .then(async result => {
        if (!result.sheet || result.script_id != script_id) return
        const workbook = xlsx.read(result.sheet, {
            raw: true,
            type: 'buffer',
            cellFormula: false
        });

        from = result.phone_number;
        endpoint = result.endpoint;

        const sheet_as_json = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { blankrows: false, defval: '' });
        numbers = sheet_as_json.map(row => row['Telephone']);
    });

    if (!from || !numbers.length) return res.status(404).send('missing_script_caller_id_or_phone_numbers.');

    const context = createContext(user_id, script_id);
   
    for (let i = start; i < concurrency + start; i++) {
        originate(numbers[i], from, context, endpoint)
        .then(channel => cacheChannelDetails(channel.id, channel.from, channel.to, user_id, i))
    }

    setDialerStatus(user_id, 1);

    // TODO: Cache the user's campaing progress and resources
    cacheCampaignResources(numbers, script_id, user_id);

    return res.status(200).send('dialer_initialized.');
}