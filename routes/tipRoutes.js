const express = require('express');
const tipController = require('../controllers/tipController');
const { checkCaptcha } = require('../middleware/securityMiddleware');

const router = express.Router();

router.post('/', checkCaptcha, tipController.sendTip);

module.exports = router;
