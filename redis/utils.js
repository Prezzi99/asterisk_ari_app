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

function createKey(resource, id) {
    return resource + ':' + id;
}