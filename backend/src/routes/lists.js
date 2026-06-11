const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/lists.controller');

const router = express.Router();

router.post('/share', requireAuth, ctrl.share);
router.get('/:shareToken', ctrl.getShared);

module.exports = router;
