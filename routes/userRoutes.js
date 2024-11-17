const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);
router.get('/dashboard', authController.protect, userController.dashboard);
router.get(
  '/analytics-table',
  authController.protect,
  userController.getUserAnalytics,
);

module.exports = router;
