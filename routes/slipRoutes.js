const express = require('express');
const slipController = require('../controllers/slipController');
const { checkCaptcha } = require('../middleware/securityMiddleware');

const router = express.Router();

router.post('/', checkCaptcha, slipController.submitSlip);
router.get('/:slipId', slipController.getSlipResult);
router.get('/history', slipController.getSlipHistory);

module.exports = router;
