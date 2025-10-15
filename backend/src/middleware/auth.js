const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

// Middleware weryfikacji tokena JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // { userId, email }
    next();
  });
};

// Generowanie tokena JWT
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '30d' } // Token ważny 30 dni
  );
};

// Odświeżanie tokena
const refreshToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }, (err, user) => {
    if (err && err.name !== 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Generuj nowy token
    const newToken = generateToken(user.userId, user.email);
    res.json({ token: newToken });
  });
};

module.exports = {
  authenticateToken,
  generateToken,
  refreshToken
};
