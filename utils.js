import jwt from 'jsonwebtoken';
import cache from './redis/config.js';
import { cacheChannelDetails } from './redis/utils.js';
import { originate } from './asterisk/utils.js';

export function verifyToken(cookie) {
    let token = /b_earer_token=.+/.exec(cookie);
    token = (token?.length) ? token[0].split('b_earer_token=')[1] : undefined

    if (!token) return -1;

    let user_id;

    try {
        user_id = jwt.verify(token, process.env.JWT_SECRET).user_id;
    }
    catch (err) {
        if (/jsonwebtoken/.test(err.stack)) user_id = -1
    }

    return user_id
}

export async function billUser(user, call_answered, call_ended) {
    const cost_per_min = +process.env.RATE_PER_MIN;

    const key = 'user:balance';
    let user_balance = await cache.hGet(key, user.toString());

    call_answered = new Date(call_answered);
    call_ended = new Date(call_ended);

    const duration_in_mins = (call_ended - call_answered) / 60000;

    const cost = +(cost_per_min * duration_in_mins).toFixed(3);

    user_balance = +user_balance - cost;
    
    cache.hSet(key, user.toString(), user_balance.toFixed(3));
}

export async function makeCall(details) {
    const { to, from, context, endpoint } = details;

    originate(to, from, context, endpoint)
    .then(channel => {
        const { user_id, i } = details;
        
        if (!channel) return
        cacheChannelDetails(channel.id, channel.from, channel.to, user_id, i);
    });
}