// backend/controllers/auth.controller.js
// ─── Authentication: register / login / refresh / logout ────────────────────

const jwt = require('jsonwebtoken');
const { UserModel, SessionModel, SubscriptionModel } = require('../models');
const { HTTP_STATUS, ERROR_CODES } = require('../../shared/constants');

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

function tokenExpiry(token, secret) {
  const d = jwt.decode(token);
  return new Date(d.exp * 1000).toISOString();
}

// POST /auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (UserModel.findByEmail(email)) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success : false,
        code    : ERROR_CODES.EMAIL_EXISTS,
        message : 'An account with this email already exists',
      });
    }

    const user         = UserModel.create({ name, email, password });
    const accessToken  = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    SessionModel.create(
      user.id, refreshToken,
      { ua: req.get('user-agent'), ip: req.ip },
      tokenExpiry(refreshToken, process.env.JWT_REFRESH_SECRET),
    );

    UserModel.updateLastLogin(user.id);
    const sub = SubscriptionModel.findByUser(user.id);

    res.status(HTTP_STATUS.CREATED).json({
      success      : true,
      user         : UserModel.safeData(user),
      subscription : sub,
      tokens       : { accessToken, refreshToken },
    });
  } catch (err) { next(err); }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = UserModel.findByEmail(email);

    if (!user || !user.password_hash || !UserModel.verifyPassword(password, user.password_hash)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success : false,
        code    : ERROR_CODES.INVALID_CREDENTIALS,
        message : 'Invalid email or password',
      });
    }

    const accessToken  = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    SessionModel.create(
      user.id, refreshToken,
      { ua: req.get('user-agent'), ip: req.ip },
      tokenExpiry(refreshToken, process.env.JWT_REFRESH_SECRET),
    );
    UserModel.updateLastLogin(user.id);

    const sub = SubscriptionModel.findByUser(user.id);

    res.json({
      success      : true,
      user         : UserModel.safeData(user),
      subscription : sub,
      tokens       : { accessToken, refreshToken },
    });
  } catch (err) { next(err); }
}

// POST /auth/refresh
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Refresh token required' });
    }

    const session = SessionModel.findByToken(refreshToken);
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false, code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired refresh token',
      });
    }

    let payload;
    try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
    catch {
      SessionModel.revoke(refreshToken);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, code: ERROR_CODES.TOKEN_EXPIRED });
    }

    // Rotate refresh token
    SessionModel.revoke(refreshToken);
    const newAccess  = signAccessToken(payload.sub);
    const newRefresh = signRefreshToken(payload.sub);
    SessionModel.create(
      payload.sub, newRefresh,
      { ua: req.get('user-agent'), ip: req.ip },
      tokenExpiry(newRefresh, process.env.JWT_REFRESH_SECRET),
    );

    res.json({ success: true, tokens: { accessToken: newAccess, refreshToken: newRefresh } });
  } catch (err) { next(err); }
}

// POST /auth/logout
async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) SessionModel.revoke(refreshToken);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) { next(err); }
}

// GET /auth/me
async function me(req, res) {
  const sub = SubscriptionModel.findByUser(req.user.id);
  res.json({ success: true, user: req.user, subscription: sub });
}

module.exports = { register, login, refresh, logout, me };
