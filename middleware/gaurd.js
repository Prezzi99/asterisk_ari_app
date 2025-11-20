import jwt from 'jsonwebtoken';

export async function authGuard(req, res, next) {  
    let token = /b_earer_token=.+/.exec(req.headers.cookie);
    token = (token?.length) ? token[0].split('b_earer_token=')[1] : undefined

    if (!token) return res.status(401).send('missing_token.')
    
    try {
        const { user_id } = jwt.verify(token, process.env.JWT_SECRET);

        if (req.body === undefined) req.body = {}

        req.body.user_id = user_id;

        next();
    } catch (err) {
        return res.status(401).send('invalid_token');
    }
}