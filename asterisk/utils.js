import { config } from 'dotenv';

config({path: './config.env'});

const key = process.env.ARI_USERNAME + ':' + process.env.ARI_PASSWORD;
const host = process.env.ARI_HOST;
const app = process.env.ARI_APP;

export async function originate(to, from, context, endpoint) {
    if (!to || !from) return

    // Encode the '+' characters in the phone numbers
    to = encodeURIComponent(to);
    from = encodeURIComponent(from);

    const uri = `/ari/channels?api_key=${key}&endpoint=PJSIP/${to}@${endpoint}&extension=${to}&context=${context}&priority=1&callerId=${from}`;
    const url = 'http' + '://' + host + uri;

    return await fetch(url, { method: 'POST'})
    .then(async response => {
        const channel = await response.json();

        // Subscribe to events from the created channel
        subscribe(channel.id, 'channel');

        return {
            id: channel.id, 
            from: decodeURIComponent(from), 
            to: decodeURIComponent(to)
        }
    })
}

async function subscribe(id, resource) {
    if (resource === undefined || id === undefined) return

    const uri = `/ari/applications/${app}/subscription?api_key=${key}&eventSource=${resource}:${id}`;
    const url = 'http' + '://' + host + uri;

    fetch(url, { method: 'POST' })
    .catch(err => console.log(err))
}