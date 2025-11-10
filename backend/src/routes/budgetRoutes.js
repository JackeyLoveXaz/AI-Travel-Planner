const express = require('express');
const router = express.Router();
const {
  createBudget,
  getBudget,
  updateBudget,
  updateBudgetCategory
} = require('../controllers/budgetController');

// 预算路由
router.route('/')
  .post(createBudget);       // 创建预算

router.route('/:id')
  .get(getBudget)           // 获取预算
  .put(updateBudget);       // 更新预算

router.route('/category/:categoryId')
  .put(updateBudgetCategory); // 更新预算类别

module.exports = router;