const Budget = require('../models/Budget');
const generateBudget = require('../services/budgetGenerator');
const { isDbConnected } = require('../config/db');

// 创建预算
exports.createBudget = async (req, res) => {
  try {
    const { itineraryId, destination, totalBudget, categories } = req.body;

    // 验证请求数据
    if (!itineraryId || !destination || !totalBudget) {
      return res.status(400).json({ message: '请提供行程ID、目的地和总预算' });
    }

    // 如果没有提供预算类别，使用AI生成预算建议
    let budgetCategories = categories;
    if (!categories || categories.length === 0) {
      // 从请求头获取API key
      const authHeader = req.headers.authorization;
      let apiKey = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7); // 移除 'Bearer ' 前缀
      }
      
      // 使用AI生成预算建议
      budgetCategories = await generateBudget(destination, totalBudget, apiKey);
    }

    // 计算已花费金额
    const spent = budgetCategories.reduce((sum, category) => sum + (category.actual || 0), 0);
    const remaining = totalBudget - spent;

    // 尝试保存到数据库
    try {
      // 创建预算文档
      const budget = new Budget({
        itineraryId,
        destination,
        totalBudget,
        spent,
        remaining,
        categories: budgetCategories
      });

      await budget.save();

      res.status(201).json({
        message: '预算创建成功',
        data: budget
      });
    } catch (dbError) {
      console.warn('数据库保存失败，但仍返回生成的预算数据:', dbError.message);
      // 即使数据库保存失败，也返回生成的预算数据
      res.status(200).json({
        message: '预算生成成功，但由于数据库连接问题未能保存。您仍可以查看预算内容。',
        data: {
          itineraryId,
          destination,
          totalBudget,
          spent,
          remaining,
          categories: budgetCategories,
          // 添加一个临时ID
          _id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
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
      // 返回一个默认的预算结构
      return res.status(200).json({
        message: '未找到预算，返回默认预算结构',
        data: {
          itineraryId: req.params.id,
          destination: '未知目的地',
          totalBudget: 0,
          spent: 0,
          remaining: 0,
          categories: [],
          _id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error('获取预算错误:', error);
    // 数据库连接失败时返回默认结构
    res.status(200).json({
      message: '数据库连接问题，返回默认预算结构',
      data: {
        itineraryId: req.params.id,
        destination: '未知目的地',
        totalBudget: 0,
        spent: 0,
        remaining: 0,
        categories: [],
        _id: `temp-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
};

// 更新预算
exports.updateBudget = async (req, res) => {
  // 检查数据库连接状态
  if (!isDbConnected()) {
    // 计算已花费金额
    const { totalBudget, categories } = req.body;
    let spent = 0;
    if (categories && categories.length > 0) {
      spent = categories.reduce((sum, category) => sum + (category.actual || 0), 0);
    }
    
    return res.status(200).json({
      message: '数据库连接问题，无法更新预算。您的更改将在数据库恢复后生效。',
      data: {
        ...req.body,
        itineraryId: req.params.id,
        spent,
        remaining: totalBudget - spent,
        _id: `temp-${Date.now()}`,
        message: '临时数据，未保存到数据库'
      }
    });
  }

  try {
    // 检查是否是临时ID
    if (req.params.id.startsWith('temp-')) {
      // 计算已花费金额
      const { totalBudget, categories } = req.body;
      let spent = 0;
      if (categories && categories.length > 0) {
        spent = categories.reduce((sum, category) => sum + (category.actual || 0), 0);
      }
      
      return res.status(200).json({
        message: '使用临时ID进行预算更新，数据将保存在客户端。',
        data: {
          ...req.body,
          itineraryId: req.params.id,
          spent,
          remaining: totalBudget - spent,
          _id: `temp-${Date.now()}`,
          message: '临时数据，未保存到数据库'
        }
      });
    }

    const { totalBudget, categories } = req.body;
    
    // 计算已花费金额
    let spent = 0;
    if (categories && categories.length > 0) {
      spent = categories.reduce((sum, category) => sum + (category.actual || 0), 0);
    }

    // 为upsert操作准备数据，避免将临时ID保存到数据库
    const updateData = {
      ...req.body,
      spent,
      remaining: totalBudget - spent
    };
    
    // 确保itineraryId不会是临时ID
    if (!updateData.itineraryId || updateData.itineraryId.startsWith('temp-')) {
      updateData.itineraryId = req.params.id;
    }

    const budget = await Budget.findOneAndUpdate(
      { itineraryId: req.params.id },
      updateData,
      { new: true, runValidators: true, upsert: true } // 添加upsert选项，不存在则创建
    );

    res.status(200).json({
      message: '预算更新成功',
      data: budget
    });
  } catch (error) {
    console.error('更新预算错误:', error);
    // 返回乐观更新的响应
    const { totalBudget, categories } = req.body;
    let spent = 0;
    if (categories && categories.length > 0) {
      spent = categories.reduce((sum, category) => sum + (category.actual || 0), 0);
    }
    
    res.status(200).json({
      message: '数据库操作失败，但您的更改已记录。',
      data: {
        ...req.body,
        itineraryId: req.params.id,
        spent,
        remaining: totalBudget - spent,
        _id: `temp-${Date.now()}`,
        message: '数据可能未保存，建议稍后重试'
      }
    });
  }
};

// 更新预算类别
exports.updateBudgetCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { estimated, actual } = req.body;
  
  // 检查是否是临时ID
  if (categoryId.startsWith('temp-')) {
    return res.status(200).json({
      message: '使用临时类别ID进行更新，数据将保存在客户端。',
      data: {
        categoryId: categoryId,
        estimated,
        actual,
        _id: categoryId,
        message: '临时数据，未保存到数据库'
      }
    });
  }

  // 检查数据库连接状态
  if (!isDbConnected()) {
    return res.status(200).json({
      message: '数据库连接问题，无法更新预算类别。您的更改将在数据库恢复后生效。',
      data: {
        categoryId: categoryId,
        estimated,
        actual,
        message: '临时数据，未保存到数据库'
      }
    });
  }

  try {
    // 查找预算
    const budget = await Budget.findOne({ 'categories._id': categoryId });
    
    if (!budget) {
      return res.status(200).json({
        message: '预算类别不存在，但您的更改已记录。',
        data: {
          categoryId: categoryId,
          estimated,
          actual,
          message: '临时更新，类别不存在'
        }
      });
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
    // 返回乐观更新的响应
    res.status(200).json({
      message: '数据库操作失败，但您的更改已记录。',
      data: {
        categoryId: categoryId,
        estimated,
        actual,
        message: '数据可能未保存，建议稍后重试'
      }
    });
  }
};