// backend/controllers/palm.controller.js
const { analyzePalm }       = require('../services/PalmService');
const { ReportModel, SubscriptionModel } = require('../models');
const { MODELS }            = require('../../shared/constants');

async function analyze(req, res, next) {
  try {
    const t0          = Date.now();
    const imageBase64 = req.file?.buffer.toString('base64') || req.body.imageBase64 || null;
    const mimeType    = req.file?.mimetype || req.body.mimeType || 'image/jpeg';

    SubscriptionModel.deductCredit(req.user.id);

    const reportData = await analyzePalm({ imageBase64, mimeType, userId: req.user.id });

    const report = ReportModel.create({
      userId     : req.user.id,
      profileId  : req.body.profileId || null,
      type       : 'palm',
      title      : `Palm Reading — ${new Date().toLocaleDateString('en-IN')}`,
      modelUsed  : MODELS.SONNET,
      inputData  : { hasImage: Boolean(imageBase64), mimeType },
      reportData,
      durationMs : Date.now() - t0,
    });

    res.json({
      success : true,
      report  : ReportModel.parseData(report),
      credits : SubscriptionModel.creditsRemaining(req.user.id),
    });
  } catch (err) { next(err); }
}

module.exports = { analyze };

// ─────────────────────────────────────────────────────────────────────────────

// backend/controllers/kundali.controller.js
const { generateKundali }  = require('../services/KundaliService');

async function generate(req, res, next) {
  try {
    const t0 = Date.now();
    const { name, dob, tob, pob, latitude, longitude, profileId } = req.body;

    SubscriptionModel.deductCredit(req.user.id);

    const reportData = await generateKundali({
      name, dob, tob: tob || null, pob, latitude, longitude, userId: req.user.id,
    });

    const report = ReportModel.create({
      userId    : req.user.id,
      profileId : profileId || null,
      type      : 'kundali',
      title     : `${name || 'Kundali'} — ${dob}`,
      modelUsed : MODELS.SONNET,
      inputData : { name, dob, tob, pob, latitude, longitude },
      reportData,
      durationMs: Date.now() - t0,
    });

    res.json({
      success : true,
      report  : ReportModel.parseData(report),
      credits : SubscriptionModel.creditsRemaining(req.user.id),
    });
  } catch (err) { next(err); }
}

module.exports.generate = generate;

// ─────────────────────────────────────────────────────────────────────────────

// backend/controllers/transit.controller.js
const { getDailyTransit, getRemedies } = require('../services/TransitService');

async function dailyTransit(req, res, next) {
  try {
    const moonSign = req.query.moonSign || req.user?.moon_sign || 'Taurus';
    const data     = await getDailyTransit({ moonSign, userId: req.user?.id });
    res.json({ success: true, transit: data, moonSign });
  } catch (err) { next(err); }
}

async function remedies(req, res, next) {
  try {
    const { lagna = 'Scorpio', issues = [] } = req.body;
    const data = await getRemedies({ lagna, issues, userId: req.user.id });
    res.json({ success: true, remedies: data });
  } catch (err) { next(err); }
}

module.exports.dailyTransit = dailyTransit;
module.exports.remedies     = remedies;

// ─────────────────────────────────────────────────────────────────────────────

// backend/controllers/profiles.controller.js
const { ProfileModel: PM } = require('../models');
const { HTTP_STATUS }      = require('../../shared/constants');

const list   = (req, res) => res.json({ success: true, profiles: PM.findAllByUser(req.user.id) });

const create = (req, res, next) => {
  try {
    const profile = PM.create(req.user.id, req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, profile });
  } catch (err) { next(err); }
};

const update = (req, res, next) => {
  try {
    const p = PM.update(req.params.uuid, req.user.id, req.body);
    if (!p) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, profile: p });
  } catch (err) { next(err); }
};

const remove = (req, res, next) => {
  try {
    PM.delete(req.params.uuid, req.user.id);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) { next(err); }
};

const setDefault = (req, res, next) => {
  try {
    PM.setDefault(req.params.uuid, req.user.id);
    res.json({ success: true, profiles: PM.findAllByUser(req.user.id) });
  } catch (err) { next(err); }
};

module.exports.profilesCtrl = { list, create, update, remove, setDefault };

// ─────────────────────────────────────────────────────────────────────────────

// backend/controllers/reports.controller.js
const { ReportModel: RM } = require('../models');

const list = (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query;
  const reports = RM.findAllByUser(req.user.id, { type, limit: Number(limit), offset: Number(offset) });
  const total   = RM.countByUser(req.user.id, type);
  res.json({ success: true, reports: reports.map(RM.parseData), total });
};

const get = (req, res) => {
  const r = RM.findByUuid(req.params.uuid, req.user.id);
  if (!r) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, report: RM.parseData(r) });
};

const star = (req, res, next) => {
  try {
    const r = RM.toggleStar(req.params.uuid, req.user.id);
    res.json({ success: true, is_starred: r?.is_starred });
  } catch (err) { next(err); }
};

const remove = (req, res, next) => {
  try {
    RM.delete(req.params.uuid, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports.reportsCtrl = { list, get, star, remove };
