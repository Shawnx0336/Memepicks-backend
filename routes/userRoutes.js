const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/profile', userController.getUserProfile);
router.post('/update', userController.updateUserProfile);

module.exports = router;
