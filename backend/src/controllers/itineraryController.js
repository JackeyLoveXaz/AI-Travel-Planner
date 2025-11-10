const Itinerary = require('../models/Itinerary');
const generateItinerary = require('../services/itineraryGenerator');

// 创建行程
exports.createItinerary = async (req, res) => {
  try {
    const { destination, startDate, endDate, preferences } = req.body;

    // 验证请求数据
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ message: '请提供目的地、开始日期和结束日期' });
    }

    // 计算行程天数
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 使用AI生成行程内容
    const aiGeneratedDays = await generateItinerary(destination, startDate, endDate, preferences);

    // 创建行程文档
    const itinerary = new Itinerary({
      destination,
      startDate,
      endDate,
      days: aiGeneratedDays,
      preferences
    });

    await itinerary.save();

    res.status(201).json({
      message: '行程创建成功',
      data: itinerary
    });
  } catch (error) {
    console.error('创建行程错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取行程列表
exports.getItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.status(200).json(itineraries);
  } catch (error) {
    console.error('获取行程列表错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 获取单个行程
exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: '行程不存在' });
    }

    res.status(200).json(itinerary);
  } catch (error) {
    console.error('获取行程错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新行程
exports.updateItinerary = async (req, res) => {
  try {
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
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 删除行程
exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: '行程不存在' });
    }

    res.status(200).json({ message: '行程删除成功' });
  } catch (error) {
    console.error('删除行程错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};