import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('[Auth] Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[Auth] Missing or invalid Bearer format');
        return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('[Auth] Token extracted (length):', token.length);

    try {
        const secret = process.env.JWT_SECRET || 'SMAPP_JWT_SECRET';
        const decoded = jwt.verify(token, secret);
        console.log('[Auth] Verified for user:', decoded.id);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[Auth] Verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
