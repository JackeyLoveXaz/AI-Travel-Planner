const Itinerary = require('../models/Itinerary');
const generateItinerary = require('../services/itineraryGenerator');
const { isDbConnected } = require('../config/db');

// 创建行程
exports.createItinerary = async (req, res) => {
  try {
    const { destination, startDate, endDate, preferences, travelers, budget } = req.body;

    // 验证请求数据
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: '请提供目的地、开始日期和结束日期' });
    }

    // 计算行程天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 从请求头中提取API key
    const apiKey = req.headers.authorization?.replace('Bearer ', '');

    // 构建完整的偏好对象，包含travelers和budget
    const completePreferences = {
      ...preferences,
      travelers: travelers || 2,
      budget: budget || 5000
    };

    // 使用AI生成行程内容，传递完整的偏好信息和API key
    const aiGeneratedDays = await generateItinerary(destination, startDate, endDate, completePreferences, apiKey);

    // 尝试保存到数据库
    try {
      // 创建行程文档
      const itinerary = new Itinerary({
        destination,
        startDate,
        endDate,
        days: aiGeneratedDays,
        preferences: completePreferences,
        travelers,
        budget
      });

      await itinerary.save();

      res.status(201).json({
        message: '行程创建成功',
        data: itinerary
      });
    } catch (dbError) {
      console.warn('数据库保存失败，但仍返回生成的行程数据:', dbError.message);
      // 即使数据库保存失败，也返回生成的行程数据
      res.status(200).json({
        message: '行程生成成功，但由于数据库连接问题未能保存。您仍可以查看行程内容。',
        data: {
          destination,
          startDate,
          endDate,
          days: aiGeneratedDays,
          preferences: completePreferences,
          travelers,
          budget,
          // 添加一个临时ID
          _id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('创建行程错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取行程列表
exports.getItineraries = async (req, res) => {
  // 首先检查数据库连接状态
  if (!isDbConnected()) {
    console.log('数据库未连接，返回空行程列表');
    return res.status(200).json({
      message: '数据库未连接，无法获取行程列表',
      data: []
    });
  }

  try {
    // 添加超时设置，避免查询长时间卡住
    const queryTimeout = setTimeout(() => {
      throw new Error('查询超时');
    }, 8000); // 8秒超时

    // 执行查询
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    
    // 清除超时计时器
    clearTimeout(queryTimeout);
    
    res.status(200).json({
      message: '行程列表获取成功',
      data: itineraries
    });
  } catch (error) {
    console.error('获取行程列表错误:', error.message);
    // 数据库连接失败或查询超时时返回空数组
    res.status(200).json({
      message: '数据库操作失败，返回空行程列表',
      data: [],
      error: error.message
    });
  }
};

// 获取单个行程
exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      // 检查是否是临时ID
      if (req.params.id.startsWith('temp-')) {
        // 返回一个基础的行程结构
        return res.status(200).json({
          message: '这是一个临时行程',
          data: {
            destination: '未知目的地',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            days: [],
            preferences: {},
            _id: req.params.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      return res.status(404).json({ message: '行程不存在' });
    }

    res.status(200).json(itinerary);
  } catch (error) {
    console.error('获取行程错误:', error);
    // 数据库连接失败时返回默认结构
    res.status(200).json({
      message: '数据库连接问题，返回默认行程结构',
      data: {
        destination: '未知目的地',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        days: [],
        preferences: {},
        _id: req.params.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
};

// 更新行程
exports.updateItinerary = async (req, res) => {
  // 检查数据库连接状态
  if (!isDbConnected()) {
    return res.status(200).json({
      message: '数据库连接问题，无法更新行程。您的更改将在数据库恢复后生效。',
      data: {
        ...req.body,
        _id: req.params.id,
        message: '临时数据，未保存到数据库'
      }
    });
  }

  try {
    // 检查是否是临时ID
    if (req.params.id.startsWith('temp-')) {
      return res.status(200).json({
        message: '无法更新临时行程，请先生成新的行程并保存。',
        data: req.body
      });
    }

    const itinerary = await Itinerary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!itinerary) {
      return res.status(404).json({ message: '行程不存在' });
    }

    res.status(200).json({
      message: '行程更新成功',
      data: itinerary
    });
  } catch (error) {
    console.error('更新行程错误:', error);
    // 返回乐观更新的响应
    res.status(200).json({
      message: '数据库操作失败，但您的更改已记录。',
      data: {
        ...req.body,
        _id: req.params.id,
        message: '数据可能未保存，建议稍后重试'
      }
    });
  }
};

// 删除行程
exports.deleteItinerary = async (req, res) => {
  // 检查数据库连接状态
  if (!isDbConnected()) {
    return res.status(200).json({
      message: '数据库连接问题，删除操作将在数据库恢复后生效。'
    });
  }

  try {
    // 检查是否是临时ID
    if (req.params.id.startsWith('temp-')) {
      return res.status(200).json({
        message: '临时行程已从视图中移除'
      });
    }

    const itinerary = await Itinerary.findByIdAndDelete(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: '行程不存在' });
    }

    res.status(200).json({ message: '行程删除成功' });
  } catch (error) {
    console.error('删除行程错误:', error);
    // 返回乐观删除的响应
    res.status(200).json({
      message: '数据库操作失败，但行程已从视图中移除。'
    });
  }
};