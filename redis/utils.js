import cache from './config.js';

export async function cacheChannelDetails(id, from, to, user, i) {
    const key = createKey('channel', id);

    cache.hSet(key, ['user', user.toString(), 'to', to, 'from', from, 'sheet_index', i.toString()]);
}

export async function setChannelAnswered(id, timestamp) {
    const key = createKey('channel', id);
    cache.hSet(key, 'answered', timestamp);
}

export async function setChannelEnded(id, timestamp) {
    const key = createKey('channel', id);
    cache.hSet(key, 'ended', timestamp);
}

export async function getChannelDetails(id) {
    const key = createKey('channel', id);
    return await cache.hGetAll(key)
}

export async function cacheCampaignResources(user_id, numbers, script_id, sheet_id, caller_ids) {
    const leads_key = `user:${user_id}:leads`;
    const caller_ids_key = `user:${user_id}:caller_ids`

    const pipeline = cache.multi();

    numbers.forEach(number => pipeline.rPush(leads_key, number.toString()));
    caller_ids.forEach(caller_id => pipeline.rPush(caller_ids_key, caller_id.toString()));

    pipeline.set(`user:${user_id}:script:id`, script_id.toString());
    pipeline.set(`user:${user_id}:sheet:id`, sheet_id.toString());

    pipeline.exec();
}

export async function cacheCallStatus(user_id, call_status) {
    const key = `user:${user_id}:call:status:report`;
    cache.rPush(key, call_status);
}

export async function getOngoingCampaignResources(user_id) {
    const prefix = `user:${user_id}:`;

    const pipeline = cache.multi();

    pipeline.get(prefix + 'sheet:id');
    pipeline.get(prefix + 'campaign:start:index');
    pipeline.lRange(prefix + 'call:status:report', 0, -1);

    return await pipeline.exec();
}

export async function setDialerStatus(user_id, status) {
    const key = `user:${user_id}:dialer:status`;

    cache.set(key, status.toString());
}

export async function getDialerStatus(user_id) {
    const key = `user:${user_id}:dialer:status`;

    return await cache.get(key);
}

export async function dumpCampaignResources(user_id) {
    cache.keys(`user:${user_id}*`)
    .then(keys => {
        const pipeline = cache.multi();
        keys.forEach(key => pipeline.del(key));

        pipeline.exec();
    });
}

function createKey(resource, id) {
    return resource + ':' + id;
}

export async function setCampaignIndicies(user_id, start_index, sheet_index, caller_id_index, count_caller_id) {
    const key = `user:${user_id}:campaign:indicies`;

    const pairs = [
        'start_index', start_index.toString(),
        'next_lead', sheet_index.toString(), 
        'next_caller_id', caller_id_index.toString(),
        'count_caller_id', count_caller_id.toString()
    ]

    cache.hSet(key, pairs);
}