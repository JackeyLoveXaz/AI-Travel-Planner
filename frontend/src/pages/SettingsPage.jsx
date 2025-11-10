import { useState, useEffect } from 'react';
import '../styles/SettingsPage.css';

function SettingsPage() {
  const [preferences, setPreferences] = useState({
    currency: 'CNY',
    language: 'zh-CN',
    theme: 'light',
    apiKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [message, setMessage] = useState('');
  
  // 从localStorage加载已保存的API Key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('aiTravelPlannerApiKey');
    const savedPreferences = localStorage.getItem('aiTravelPlannerPreferences');
    
    if (savedApiKey) {
      setPreferences(prev => ({ ...prev, apiKey: savedApiKey }));
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
    const { apiKey, ...otherPrefs } = preferences;
    
    // 保存API Key（敏感信息）
    if (apiKey) {
      localStorage.setItem('aiTravelPlannerApiKey', apiKey);
    } else {
      localStorage.removeItem('aiTravelPlannerApiKey');
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
            <label htmlFor="apiKey">API Key</label>
            <div className="api-key-input-container">
              <input 
                type={showApiKey ? "text" : "password"}
                id="apiKey" 
                value={preferences.apiKey} 
                onChange={handleApiKeyChange}
                placeholder="请输入您的API Key"
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