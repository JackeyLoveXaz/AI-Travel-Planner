import { useState, useEffect } from 'react';
import '../styles/SettingsPage.css';

function SettingsPage() {
  const [preferences, setPreferences] = useState({
    currency: 'CNY',
    language: 'zh-CN',
    theme: 'light',
    apiKey: '',
    amapApiKey: '',
    amapSecurityKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [message, setMessage] = useState('');
  
  // 从localStorage加载已保存的设置
  useEffect(() => {
    const savedApiKey = localStorage.getItem('aiTravelPlannerApiKey');
    const savedAmapApiKey = localStorage.getItem('aiTravelPlannerAmapApiKey');
    const savedAmapSecurityKey = localStorage.getItem('aiTravelPlannerAmapSecurityKey');
    const savedPreferences = localStorage.getItem('aiTravelPlannerPreferences');
    
    if (savedApiKey) {
      setPreferences(prev => ({ ...prev, apiKey: savedApiKey }));
    }
    
    if (savedAmapApiKey) {
      setPreferences(prev => ({ ...prev, amapApiKey: savedAmapApiKey }));
    }
    
    if (savedAmapSecurityKey) {
      setPreferences(prev => ({ ...prev, amapSecurityKey: savedAmapSecurityKey }));
    }
    
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('解析保存的设置失败:', e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 保存设置到localStorage
    const { apiKey, amapApiKey, amapSecurityKey, ...otherPrefs } = preferences;
    
    // 保存API Key（敏感信息）- 添加trim处理避免空格问题
    if (apiKey) {
      localStorage.setItem('aiTravelPlannerApiKey', apiKey.trim());
    } else {
      localStorage.removeItem('aiTravelPlannerApiKey');
    }
    
    // 保存高德地图API Key（敏感信息）- 添加trim处理避免空格问题
    if (amapApiKey) {
      localStorage.setItem('aiTravelPlannerAmapApiKey', amapApiKey.trim());
    } else {
      localStorage.removeItem('aiTravelPlannerAmapApiKey');
    }
    
    // 保存高德地图安全密钥（敏感信息）- 添加trim处理避免空格问题
    if (amapSecurityKey) {
      localStorage.setItem('aiTravelPlannerAmapSecurityKey', amapSecurityKey.trim());
    } else {
      localStorage.removeItem('aiTravelPlannerAmapSecurityKey');
    }
    
    // 保存其他偏好设置
    localStorage.setItem('aiTravelPlannerPreferences', JSON.stringify(otherPrefs));
    
    setMessage('设置已成功保存！');
    setTimeout(() => setMessage(''), 3000);
    
    // 在实际应用中，这里会保存用户设置到后端
    console.log('设置已保存到本地存储');
  };
  
  const handleApiKeyChange = (e) => {
    setPreferences(prev => ({ ...prev, apiKey: e.target.value }));
  };

  return (
    <div className="settings-page">
      <h1>设置</h1>
      
      {message && <div className="success-message">{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="section">
          <h2>API 配置</h2>
          <div className="form-group">
            <label htmlFor="apiKey">AI API Key</label>
            <div className="api-key-input-container">
              <input 
                type={showApiKey ? "text" : "password"}
                id="apiKey" 
                value={preferences.apiKey} 
                onChange={handleApiKeyChange}
                placeholder="请输入您的AI API Key"
                className="api-key-input"
              />
              <button 
                type="button" 
                className="toggle-visibility" 
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="helper-text">输入API Key以启用AI旅行规划功能。该信息将仅保存在您的本地浏览器中。</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="amapApiKey">高德地图API Key</label>
            <div className="api-key-input-container">
              <input 
                type={showApiKey ? "text" : "password"}
                id="amapApiKey" 
                value={preferences.amapApiKey} 
                onChange={(e) => setPreferences(prev => ({ ...prev, amapApiKey: e.target.value }))}
                placeholder="请输入您的高德地图API Key"
                className="api-key-input"
              />
              <button 
                type="button" 
                className="toggle-visibility" 
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="helper-text">输入高德地图API Key以启用地图页面功能。该信息将仅保存在您的本地浏览器中。</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="amapSecurityKey">高德地图安全密钥</label>
            <div className="api-key-input-container">
              <input 
                type={showApiKey ? "text" : "password"}
                id="amapSecurityKey" 
                value={preferences.amapSecurityKey} 
                onChange={(e) => setPreferences(prev => ({ ...prev, amapSecurityKey: e.target.value }))}
                placeholder="请输入您的高德地图安全密钥"
                className="api-key-input"
              />
              <button 
                type="button" 
                className="toggle-visibility" 
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
            </div>
            <p className="helper-text">输入高德地图安全密钥以获取用户位置信息。该信息将仅保存在您的本地浏览器中。</p>
          </div>
        </div>
        
        <div className="section">
          <h2>通用设置</h2>
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
        </div>
        
        <button type="submit" className="btn-primary">保存设置</button>
      </form>
    </div>
  );
}

export default SettingsPage;