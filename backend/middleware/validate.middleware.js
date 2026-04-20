// backend/middleware/validate.middleware.js + error.middleware.js

const { validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES } = require('../../shared/constants');

// ── Request Validation ────────────────────────────────────────────────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.UNPROCESSABLE).json({
      success : false,
      code    : ERROR_CODES.VALIDATION_ERROR,
      message : 'Validation failed',
      errors  : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ── Credits Check Factory ─────────────────────────────────────────────────────
const { SubscriptionModel } = require('../models');

function requireCredits(req, res, next) {
  if (!SubscriptionModel.hasCredits(req.user.id)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success : false,
      code    : ERROR_CODES.INSUFFICIENT_CREDITS,
      message : 'No credits remaining. Please upgrade your plan.',
      credits : 0,
    });
  }
  next();
}

// ── Global Error Handler ──────────────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Anthropic API errors
  if (err.status === 529 || err.message?.includes('overloaded')) {
    return res.status(503).json({
      success : false,
      code    : ERROR_CODES.AI_ERROR,
      message : 'AI service temporarily unavailable. Please try again.',
    });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false, message: 'Invalid JSON in request body',
    });
  }

  const status = err.statusCode || err.status || HTTP_STATUS.SERVER_ERROR;
  res.status(status).json({
    success : false,
    message : err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// ── 404 Handler ───────────────────────────────────────────────────────────────
function notFound(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success : false,
    message : `Route ${req.method} ${req.path} not found`,
  });
}

module.exports = { validate, requireCredits, errorHandler, notFound };
