import jwt from 'jsonwebtoken';

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