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

export async function cacheCampaignResources(numbers, script_id, user_id) {
    const leads_key = `user:${user_id}:leads`;

    const pipeline = cache.multi();
    numbers.forEach(number => pipeline.lPush(leads_key, number.toString()));

    pipeline.set(`user:${user_id}:script`, script_id.toString());
    pipeline.exec();
}

function createKey(resource, id) {
    return resource + ':' + id;
}