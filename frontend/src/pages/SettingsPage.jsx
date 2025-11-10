import { useState } from 'react';

function SettingsPage() {
  const [preferences, setPreferences] = useState({
    currency: 'CNY',
    language: 'zh-CN',
    theme: 'light'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 在实际应用中，这里会保存用户设置到后端
    alert('设置已保存！');
  };

  return (
    <div className="settings-page">
      <h1>设置</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currency">货币</label>
          <select 
            id="currency" 
            name="currency" 
            value={preferences.currency} 
            onChange={handleChange}
          >
            <option value="CNY">人民币 (¥)</option>
            <option value="USD">美元 ($)</option>
            <option value="EUR">欧元 (€)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="language">语言</label>
          <select 
            id="language" 
            name="language" 
            value={preferences.language} 
            onChange={handleChange}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="theme">主题</label>
          <select 
            id="theme" 
            name="theme" 
            value={preferences.theme} 
            onChange={handleChange}
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
        
        <button type="submit" className="btn-primary">保存设置</button>
      </form>
    </div>
  );
}

export default SettingsPage;