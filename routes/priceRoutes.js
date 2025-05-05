const express = require('express');
const priceController = require('../controllers/priceController');

const router = express.Router();

router.get('/:coinSymbol', priceController.getCoinPrice);

module.exports = router;
