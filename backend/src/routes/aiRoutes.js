const express = require('express');
const router = express.Router();
const {
  generateTravelPlan
} = require('../controllers/aiController');

// AI路由
router.route('/travel-plan')
  .post(generateTravelPlan);  // 生成旅行计划

module.exports = router;