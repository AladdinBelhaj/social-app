import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    console.log('[MCSV-Auth] No token found in header');
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'SMAPP_JWT_SECRET';
    const payload = jwt.verify(token, secret);
    console.log('[MCSV-Auth] Token verified for user:', payload.id);
    req.user = { id: payload.id, email: payload.email };
    return next();
  } catch (error) {
    console.error('[MCSV-Auth] Token verification failed:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

