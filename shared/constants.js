// shared/constants.js  — consumed by both backend & frontend

const MODELS = {
  SONNET : 'claude-sonnet-4-20250514',   // Vision + deep reasoning
  HAIKU  : 'claude-haiku-4-5-20251001',  // Fast, lightweight
};

const FEATURES = {
  PALM    : 'palm',
  KUNDALI : 'kundali',
  TRANSIT : 'transit',
  REMEDY  : 'remedy',
};

const REPORT_TYPES = ['palm', 'kundali'];

const PLANS = {
  FREE   : { name: 'free',   credits:  5, label: 'Free'   },
  LITE   : { name: 'lite',   credits: 20, label: 'Lite'   },
  PRO    : { name: 'pro',    credits: 60, label: 'Pro'     },
  COSMIC : { name: 'cosmic', credits: -1, label: 'Cosmic' }, // unlimited
};

const ZODIAC = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const PLANET_SYMBOLS = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const DASHA_ORDER = [
  'Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus',
];

const HTTP_STATUS = {
  OK            : 200,
  CREATED       : 201,
  NO_CONTENT    : 204,
  BAD_REQUEST   : 400,
  UNAUTHORIZED  : 401,
  FORBIDDEN     : 403,
  NOT_FOUND     : 404,
  CONFLICT      : 409,
  UNPROCESSABLE : 422,
  TOO_MANY      : 429,
  SERVER_ERROR  : 500,
};

const ERROR_CODES = {
  INVALID_CREDENTIALS  : 'INVALID_CREDENTIALS',
  EMAIL_EXISTS         : 'EMAIL_EXISTS',
  TOKEN_EXPIRED        : 'TOKEN_EXPIRED',
  TOKEN_INVALID        : 'TOKEN_INVALID',
  PROFILE_NOT_FOUND    : 'PROFILE_NOT_FOUND',
  REPORT_NOT_FOUND     : 'REPORT_NOT_FOUND',
  INSUFFICIENT_CREDITS : 'INSUFFICIENT_CREDITS',
  AI_ERROR             : 'AI_ERROR',
  VALIDATION_ERROR     : 'VALIDATION_ERROR',
};

// Works in both Node.js (CommonJS) and browser/bundled contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODELS, FEATURES, REPORT_TYPES, PLANS,
    ZODIAC, NAKSHATRAS, PLANET_SYMBOLS, DASHA_ORDER,
    HTTP_STATUS, ERROR_CODES,
  };
} else {
  // ESM export (frontend bundler)
  Object.assign(window.__AV_CONSTANTS__ = window.__AV_CONSTANTS__ || {}, {
    MODELS, FEATURES, REPORT_TYPES, PLANS,
    ZODIAC, NAKSHATRAS, PLANET_SYMBOLS, DASHA_ORDER,
    HTTP_STATUS, ERROR_CODES,
  });
}
