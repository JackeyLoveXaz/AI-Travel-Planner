const Settings = require('../models/Settings');

// 获取用户设置
exports.getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    // 查找或创建用户设置
    let settings = await Settings.findOne({ userId });

    if (!settings) {
      // 如果不存在，创建默认设置
      settings = new Settings({ userId });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('获取用户设置错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新用户设置
exports.updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences, notifications, privacy } = req.body;

    // 查找或创建用户设置
    let settings = await Settings.findOne({ userId });

    if (!settings) {
      settings = new Settings({ userId });
    }

    // 更新设置
    if (preferences) settings.preferences = { ...settings.preferences, ...preferences };
    if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
    if (privacy) settings.privacy = { ...settings.privacy, ...privacy };

    await settings.save();

    res.status(200).json({
      message: '设置更新成功',
      data: settings
    });
  } catch (error) {
    console.error('更新用户设置错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 更新偏好设置
exports.updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { 'preferences.$.': preferences } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: '偏好设置更新成功',
      data: settings
    });
  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 删除用户设置
exports.deleteUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const settings = await Settings.findOneAndDelete({ userId });

    if (!settings) {
      return res.status(404).json({ message: '用户设置不存在' });
    }

    res.status(200).json({ message: '设置删除成功' });
  } catch (error) {
    console.error('删除用户设置错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};