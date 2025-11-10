const express = require('express');
const router = express.Router();
const {
  createItinerary,
  getItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary
} = require('../controllers/itineraryController');

// 行程路由
router.route('/')
  .post(createItinerary)     // 创建行程
  .get(getItineraries);      // 获取行程列表

router.route('/:id')
  .get(getItinerary)         // 获取单个行程
  .put(updateItinerary)      // 更新行程
  .delete(deleteItinerary);  // 删除行程

module.exports = router;