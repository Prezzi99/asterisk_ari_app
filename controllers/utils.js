import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getCampaignIndicies, getOngoingCampaignResources } from '../redis/utils.js'

export function testRegExp(pairs) {
    for (let item of pairs) {
        const regex = item[0];
        const values = item[1];

        for (let item of values) {
            if (!regex.test(item)) return false;
        }
    }

    return true
}

export function createContext(user_id, script_id) {
    return `u-${user_id}:s-${script_id}`
}

export function sign(user_id) {
    if (!user_id) throw new ReferenceError('Invalid value for token signature');

    return jwt.sign(
        { user_id },
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );
}

export async function hash(password) {
    const salt = await bcrypt.genSalt(14);
    return await bcrypt.hash(password, salt)
}

export async function compare(password, hash) {
    return await bcrypt.compare(password, hash);
}

export async function getDetailsToContinueCampaign(user_id, concurrency) {
    let { next_lead, next_caller_id } = await getCampaignIndicies(user_id)
    .then(result => {
        return {
            next_lead: +result.next_lead,
            next_caller_id: +result.next_caller_id % (+result.count_caller_id)
        }
    });

    const args = {
        lead_start: next_lead,
        lead_end: next_lead + concurrency - 1
    }

    const [ script_id, numbers, caller_ids ] = await getOngoingCampaignResources(user_id, args);

    return { script_id, numbers, caller_ids, next_lead, next_caller_id }
}