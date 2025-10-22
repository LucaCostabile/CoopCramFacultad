import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
