const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'INI_ADALAH_KUNCI_RAHASIA_ANDA_YANG_SANGAT_AMAN';

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

exports.authenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Login terlebih dahulu.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Akses ditolak: Hanya untuk admin.' });
};
