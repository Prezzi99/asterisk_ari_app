import jwt from 'jsonwebtoken';
import cache from './redis/config.js';
import { cacheChannelDetails } from './redis/utils.js';
import { originate } from './asterisk/utils.js';
import events from './events.js'

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
    const { from, context, endpoint, user_id, i } = details;
    const to = formatNumber(details.to);

    if (to === undefined) return events.emit('call-status', user_id, 'invalid number', i);

    originate(to, from, context, endpoint)
    .then(channel => {  
        if (!channel) return
        cacheChannelDetails(channel.id, channel.from, channel.to, user_id, i);
    })
    .catch(err => events.emit('call-status', user_id, 'failed', i))
}

export function formatNumber(tel) {
    if (!tel) return
    
    tel = tel.toString();
    if (/^\+1\d{10}$/.test(tel)) return tel;

    tel = tel.replaceAll(/\D/g, '');
    tel = (tel[0] == 1) ? tel : '1' + tel
    
    if (tel.length === 11) return '+' + tel
}

export class Queue {
    #endpoint_output_count = new Object();
    #endpoints;
    #round_robin_pointer = 0;
    #queued_calls = new Array();
    #max_output_per_endpoint;

    constructor(endpoints, endpoint_cap) {
        this.#endpoints = endpoints;
        this.#max_output_per_endpoint = endpoint_cap;
    }

    queue(details) {
        let endpoint = this.#endpoints[this.#round_robin_pointer];
        if (endpoint === undefined) return

        details.endpoint = endpoint;
        this.#queued_calls.push(details);

        this.#incrementOutputCount(endpoint);
        this.#setRoundRobinPointer();

        const at_max_capacity = this.#endpoint_output_count[endpoint] == this.#max_output_per_endpoint;
        if (at_max_capacity) this.#removeEndpoint(endpoint);
    }

    dequeue() {
        return this.#queued_calls.shift();
    }

    reset(endpoints) {
        this.#endpoints = endpoints;
        this.#round_robin_pointer = 0;
        this.#endpoint_output_count = new Object();
    }

    #setRoundRobinPointer() {
        const current_index = this.#round_robin_pointer;
        this.#round_robin_pointer = (current_index + 1) % this.#endpoints.length;
    }

    #incrementOutputCount(endpoint) {
        let count = this.#endpoint_output_count[endpoint] || 0;
        this.#endpoint_output_count[endpoint] = ++count;
    }

    #removeEndpoint(name) {
        const index = this.#endpoints.indexOf(name);
        this.#endpoints.splice(index, 1);

        // Reset reset_round_robin_pointer
        this.#round_robin_pointer = 0;
    }
}