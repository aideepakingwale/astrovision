// backend/middleware/auth.middleware.js
// ─── JWT authentication + optional auth middleware ───────────────────────────

const jwt           = require('jsonwebtoken');
const { UserModel } = require('../models');
const { HTTP_STATUS, ERROR_CODES } = require('../../shared/constants');

/**
 * requireAuth — blocks requests without a valid access token.
 * Attaches req.user (safe user object) on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success : false,
      code    : ERROR_CODES.TOKEN_INVALID,
      message : 'Authentication required',
    });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = UserModel.findById(payload.sub);
    if (!user) throw new Error('User not found');
    req.user = UserModel.safeData(user);
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success : false,
      code    : expired ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID,
      message : expired ? 'Access token expired' : 'Invalid access token',
    });
  }
}

/**
 * optionalAuth — attaches req.user if token is present and valid, but
 * does NOT block the request if there is no token.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const token   = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = UserModel.findById(payload.sub);
    if (user) req.user = UserModel.safeData(user);
  } catch {}
  next();
}

/**
 * requireAdmin — must be called after requireAuth.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false, message: 'Admin access required',
    });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
