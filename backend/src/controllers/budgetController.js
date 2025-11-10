const Budget = require('../models/Budget');
const generateBudget = require('../services/budgetGenerator');

// 创建预算
exports.createBudget = async (req, res) => {
  try {
    const { itineraryId, destination, totalBudget, categories } = req.body;

    // 验证请求数据
    if (!itineraryId || !destination || !totalBudget) {
      return res.status(400).json({ message: '请提供行程ID、目的地和总预算' });
    }

    // 如果没有提供预算类别，使用默认类别
    let budgetCategories = categories;
    if (!categories || categories.length === 0) {
      // 使用AI生成预算建议
      budgetCategories = await generateBudget(destination, totalBudget);
    }

    // 计算已花费金额
    const spent = budgetCategories.reduce((sum, category) => sum + (category.actual || 0), 0);

    // 创建预算文档
    const budget = new Budget({
      itineraryId,
      destination,
      totalBudget,
      spent,
      remaining: totalBudget - spent,
      categories: budgetCategories
    });

    await budget.save();

    res.status(201).json({
      message: '预算创建成功',
      data: budget
    });
  } catch (error) {
    console.error('创建预算错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取预算
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ itineraryId: req.params.id });

    if (!budget) {
      return res.status(404).json({ message: '预算不存在' });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error('获取预算错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新预算
exports.updateBudget = async (req, res) => {
  try {
    const { totalBudget, categories } = req.body;
    
    // 计算已花费金额
    let spent = 0;
    if (categories && categories.length > 0) {
      spent = categories.reduce((sum, category) => sum + (category.actual || 0), 0);
    }

    const budget = await Budget.findOneAndUpdate(
      { itineraryId: req.params.id },
      {
        ...req.body,
        spent,
        remaining: totalBudget - spent
      },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: '预算不存在' });
    }

    res.status(200).json({
      message: '预算更新成功',
      data: budget
    });
  } catch (error) {
    console.error('更新预算错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新预算类别
exports.updateBudgetCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { estimated, actual } = req.body;

    // 查找预算
    const budget = await Budget.findOne({ 'categories._id': categoryId });
    
    if (!budget) {
      return res.status(404).json({ message: '预算类别不存在' });
    }

    // 更新指定类别
    const category = budget.categories.id(categoryId);
    if (estimated !== undefined) category.estimated = estimated;
    if (actual !== undefined) category.actual = actual;

    // 重新计算总花费和剩余金额
    budget.spent = budget.categories.reduce((sum, cat) => sum + (cat.actual || 0), 0);
    budget.remaining = budget.totalBudget - budget.spent;

    await budget.save();

    res.status(200).json({
      message: '预算类别更新成功',
      data: budget
    });
  } catch (error) {
    console.error('更新预算类别错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};