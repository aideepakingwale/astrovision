// backend/routes/index.js
// ─── Central route registry — all API endpoints ─────────────────────────────

const router  = require('express').Router();
const { body, query, param } = require('express-validator');
const multer  = require('multer');

const { requireAuth, optionalAuth }    = require('../middleware/auth.middleware');
const { validate, requireCredits }     = require('../middleware/validate.middleware');
const { rateLimit } = require('express-rate-limit');

const authCtrl    = require('../controllers/auth.controller');
const {
  analyze:palmAnalyze
}                 = require('../controllers/index');
const {
  generate:kundaliGenerate,
  dailyTransit,
  remedies,
  profilesCtrl:PC,
  reportsCtrl:RC,
}                 = require('../controllers/index');

// ── Upload (memory storage; convert to base64 in controller) ─────────────────
const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: (Number(process.env.UPLOAD_MAX_SIZE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── AI rate limiter (stricter) ────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  message : { success: false, message: 'Too many AI requests, please try again later.' },
});

// ════════════════════════════════════════════════════════════════════════════
// AUTH  /api/auth/*
// ════════════════════════════════════════════════════════════════════════════
router.post('/auth/register',
  [body('name').trim().notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  validate, authCtrl.register,
);
router.post('/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate, authCtrl.login,
);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/logout',  authCtrl.logout);
router.get('/auth/me',       requireAuth, authCtrl.me);

// ════════════════════════════════════════════════════════════════════════════
// PROFILES  /api/profiles/*
// ════════════════════════════════════════════════════════════════════════════
router.get   ('/profiles',             requireAuth, PC.list);
router.post  ('/profiles',             requireAuth,
  [body('name').trim().notEmpty()], validate, PC.create,
);
router.patch ('/profiles/:uuid',       requireAuth, PC.update);
router.delete('/profiles/:uuid',       requireAuth, PC.remove);
router.patch ('/profiles/:uuid/default', requireAuth, PC.setDefault);

// ════════════════════════════════════════════════════════════════════════════
// PALM  /api/palm/*
// ════════════════════════════════════════════════════════════════════════════
router.post('/palm/analyze',
  requireAuth, aiLimiter, requireCredits,
  upload.single('image'),
  palmAnalyze,
);

// ════════════════════════════════════════════════════════════════════════════
// KUNDALI  /api/kundali/*
// ════════════════════════════════════════════════════════════════════════════
router.post('/kundali/generate',
  requireAuth, aiLimiter, requireCredits,
  [body('dob').isDate(), body('pob').trim().notEmpty()],
  validate, kundaliGenerate,
);

// ════════════════════════════════════════════════════════════════════════════
// TRANSIT & REMEDIES  /api/cosmic/*
// ════════════════════════════════════════════════════════════════════════════
router.get ('/cosmic/transit',   optionalAuth, dailyTransit);
router.post('/cosmic/remedies',  requireAuth,  aiLimiter, remedies);

// ════════════════════════════════════════════════════════════════════════════
// REPORTS  /api/reports/*
// ════════════════════════════════════════════════════════════════════════════
router.get   ('/reports',          requireAuth, RC.list);
router.get   ('/reports/:uuid',    requireAuth, RC.get);
router.patch ('/reports/:uuid/star',requireAuth, RC.star);
router.delete('/reports/:uuid',    requireAuth, RC.remove);

// ── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (_, res) => res.json({
  status: 'ok', env: process.env.NODE_ENV, ts: new Date().toISOString(),
}));

module.exports = router;
