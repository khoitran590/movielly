const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/lists.controller');

const router = express.Router();

// Stricter than the global limiter: share-link creation writes to the
// database and mints tokens, so cap it well below normal API browsing.
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many share links created — try again in a few minutes' },
});

router.post('/share', shareLimiter, requireAuth, ctrl.share);
router.get('/:shareToken', ctrl.getShared);

module.exports = router;
