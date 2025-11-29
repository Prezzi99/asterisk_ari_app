import { getScriptAudio, getScripts } from '../database/utils.js';

export async function fetch(req, res) {
    const { user_id } = req.body;
    const { script_id } = req.params;

    if (!/^\d+$/.test(user_id)) return res.status(400).send('')

    if (script_id) {
        if (!/^\d+$/.test(script_id)) return res.status(400).send('')

        const audio = await getScriptAudio(script_id, user_id);

        if (audio === undefined) return res.status(404).send('')
        
        return res.status(200).send(audio);
    }
    else {
        const scripts = await getScripts(user_id);
        return res.status(200).json(scripts)
    }
}
