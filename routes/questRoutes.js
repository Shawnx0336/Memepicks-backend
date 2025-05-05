const express = require('express');
const questController = require('../controllers/questController');

const router = express.Router();

router.get('/', questController.getActiveQuests);

module.exports = router;
