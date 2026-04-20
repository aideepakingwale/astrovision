// backend/server.js
// ─── AstroVision API Server ───────────────────────────────────────────────────

require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const compression= require('compression');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/validate.middleware');

// ── Initialise DB eagerly on startup ─────────────────────────────────────────
require('./config/database').getDb();

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin : process.env.FRONTEND_URL || 'http://localhost:5173',
  methods : ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '25mb' }));   // large base64 palm images
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs : Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max      : Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders  : false,
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  AstroVision API  ·  Port ${PORT}        ║`);
  console.log(`║  ENV: ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
  console.log(`╚══════════════════════════════════════╝\n`);
});

module.exports = app;
