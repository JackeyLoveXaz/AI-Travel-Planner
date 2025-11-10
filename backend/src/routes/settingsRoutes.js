const express = require('express');
const router = express.Router();
const {
  getUserSettings,
  updateUserSettings,
  updatePreferences,
  deleteUserSettings
} = require('../controllers/settingsController');

// 设置路由
router.route('/user/:userId')
  .get(getUserSettings)      // 获取用户设置
  .put(updateUserSettings)   // 更新用户设置
  .delete(deleteUserSettings); // 删除用户设置

router.route('/user/:userId/preferences')
  .put(updatePreferences);   // 更新偏好设置

module.exports = router;