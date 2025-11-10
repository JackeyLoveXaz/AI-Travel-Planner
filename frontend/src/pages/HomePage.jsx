import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItinerary } from '../services/itineraryService';
import { createBudget } from '../services/budgetService';
import { handleApiError, hasConfiguredApiKey } from '../services/apiConfig';
import { getTravelPlanFromAI, parseAIResult } from '../services/aiService';
import '../styles/HomePage.css';

function HomePage() {
  // 基本行程信息
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 新增核心功能字段
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [preferences, setPreferences] = useState('');
  const [textInput, setTextInput] = useState('');
  
  // 状态管理
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  
  // 检查API Key配置状态
  useEffect(() => {
    setApiKeyConfigured(hasConfiguredApiKey());
    
    // 监听localStorage变化
    const handleStorageChange = () => {
      setApiKeyConfigured(hasConfiguredApiKey());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // 语音识别初始化
  const initSpeechRecognition = () => {
    // 检查浏览器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('您的浏览器不支持语音识别功能');
      return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';
    
    return recognition;
  };

  // 开始语音识别
  const startVoiceRecognition = () => {
    if (isListening) return;
    
    const recognition = initSpeechRecognition();
    if (!recognition) return;
    
    recognitionRef.current = recognition;
    setIsListening(true);
    setError('');
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTextInput(transcript);
      // 尝试解析语音输入中的关键信息
      parseVoiceInput(transcript);
    };
    
    recognition.onerror = (event) => {
      setError('语音识别出错: ' + event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // 停止语音识别
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // 解析语音输入中的关键信息
  const parseVoiceInput = (input) => {
    // 简单的关键词解析
    const text = input.toLowerCase();
    
    // 提取目的地
    const locationPattern = /去(哪里|哪个国家|哪个城市|什么地方|哪里|哪里玩)[:：]?\s*(.+?)(?=，|。|\s|天|预算|人|喜欢)/;
    const locationMatch = text.match(locationPattern);
    if (locationMatch) {
      setDestination(locationMatch[2].trim());
    }
    
    // 提取天数
    const daysPattern = /(\d+)\s*天/;
    const daysMatch = text.match(daysPattern);
    if (daysMatch && startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + parseInt(daysMatch[1]));
      setEndDate(end.toISOString().split('T')[0]);
    }
    
    // 提取预算
    const budgetPattern = /预算[:：]?\s*(\d+(\.\d+)?)[万千]?元?/;
    const budgetMatch = text.match(budgetPattern);
    if (budgetMatch) {
      setBudget(budgetMatch[1]);
    }
    
    // 提取人数
    const peoplePattern = /(\d+)\s*[个人]/;
    const peopleMatch = text.match(peoplePattern);
    if (peopleMatch) {
      setTravelers(peopleMatch[1]);
    }
    
    // 提取偏好
    const preferencesText = [];
    if (text.includes('美食') || text.includes('吃')) preferencesText.push('美食');
    if (text.includes('动漫') || text.includes('漫画')) preferencesText.push('动漫');
    if (text.includes('孩子') || text.includes('家庭') || text.includes('亲子')) preferencesText.push('亲子');
    if (text.includes('购物')) preferencesText.push('购物');
    if (text.includes('风景') || text.includes('自然')) preferencesText.push('自然风光');
    if (text.includes('历史') || text.includes('文化')) preferencesText.push('历史文化');
    
    if (preferencesText.length > 0) {
      setPreferences(preferencesText.join(', '));
    }
  };
  
  // 处理快速输入框提交给AI直接生成行程
  const handleAIInputSubmit = async () => {
    if (!textInput.trim()) {
      setError('请输入旅行需求');
      return;
    }
    
    // 检查API Key配置
    if (!apiKeyConfigured) {
      setError('请先在设置页面配置API Key以使用AI旅行规划功能');
      return;
    }
    
    setProcessingAI(true);
    setError('');
    
    try {
      // 调用AI服务获取行程规划
      const aiResult = await getTravelPlanFromAI(textInput.trim());
      
      // 解析AI结果获取关键信息
      const parsedData = parseAIResult(aiResult);
      
      // 如果AI返回了足够的信息，直接创建行程
      if (parsedData.destination && parsedData.startDate && parsedData.endDate) {
        // 构建请求数据
        const preferencesObj = {
          travelers: parsedData.travelers || parseInt(travelers) || 1,
          preferences: parsedData.preferences || preferences.split(',').map(p => p.trim()).filter(p => p),
          ...(parsedData.budget && { budget: parseInt(parsedData.budget) })
        };
        
        // 调用API创建行程
        const itinerary = await createItinerary(
          parsedData.destination, 
          parsedData.startDate, 
          parsedData.endDate, 
          preferencesObj
        );
        
        console.log('行程创建成功:', itinerary);
        
        // 如果提供了预算，创建预算记录
        if (parsedData.budget) {
          try {
            await createBudget(
              itinerary._id, 
              parsedData.destination, 
              parseInt(parsedData.budget)
            );
            console.log('预算创建成功');
          } catch (budgetError) {
            console.warn('预算创建失败，但行程已成功创建:', budgetError);
          }
        }
        
        // 导航到行程列表页面
        navigate('/itineraries');
      } else {
        setError('AI未能解析出足够的行程信息，请尝试更详细的描述');
      }
    } catch (err) {
      setError(handleApiError(err) || 'AI行程生成失败，请重试');
      console.error('AI行程生成失败:', err);
    } finally {
      setProcessingAI(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 检查API Key配置
    if (!apiKeyConfigured) {
      setError('请先在设置页面配置API Key以使用AI旅行规划功能');
      return;
    }
    
    if (!destination || !startDate || !endDate) {
      setError('请填写目的地和日期信息');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 构建请求数据
      const preferencesObj = {
        travelers: parseInt(travelers) || 1,
        preferences: preferences.split(',').map(p => p.trim()).filter(p => p),
        ...(budget && { budget: parseInt(budget) })
      };
      
      // 调用API创建行程
      const itinerary = await createItinerary(
        destination, 
        startDate, 
        endDate, 
        preferencesObj
      );
      
      console.log('行程创建成功:', itinerary);
      
      // 如果提供了预算，创建预算记录
      if (budget) {
        try {
          await createBudget(
            itinerary._id, 
            destination, 
            parseInt(budget)
          );
          console.log('预算创建成功');
        } catch (budgetError) {
          console.warn('预算创建失败，但行程已成功创建:', budgetError);
        }
      }
      
      // 导航到行程列表页面
      navigate('/itineraries');
    } catch (err) {
      setError(handleApiError(err));
      console.error('创建行程失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h1>AI旅行规划师</h1>
      <p className="subtitle">智能规划您的完美旅程</p>
      
      {/* API Key未配置提示 */}
      {!apiKeyConfigured && (
        <div className="api-key-warning">
          <strong>提示：</strong>
          您尚未配置API Key，部分AI功能可能无法使用。
          <a href="/settings" className="config-link">立即配置</a>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="input-section">
        <h3>快速输入（语音/文字）</h3>
        <div className="voice-input-container">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入您的旅行需求，例如：'我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子'"
            rows="3"
            disabled={loading || processingAI}
          />
          <div className="input-buttons">
            <button
              type="button"
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              disabled={loading || processingAI}
            >
              {isListening ? '停止录音' : '开始录音'}
            </button>
            <button
              type="button"
              className="ai-button"
              onClick={handleAIInputSubmit}
              disabled={loading || processingAI || !textInput.trim()}
            >
              {processingAI ? (
                <>
                  <span className="loading-spinner">⟳</span>
                  AI生成行程中...
                </>
              ) : 'AI生成行程'}
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="travel-form">
        <h3>详细信息</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="destination">目的地 *</label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="例如：日本东京"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="travelers">同行人数 *</label>
            <input
              type="number"
              id="travelers"
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              min="1"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">开始日期 *</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">结束日期 *</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split('T')[0]}
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="budget">预算（元）</label>
          <input
            type="number"
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            placeholder="例如：10000"
            disabled={loading}
          />
          <div className="budget-hint">提供预算可获得更精准的行程规划和预算分配建议</div>
        </div>
        
        <div className="form-group">
          <label htmlFor="preferences">旅行偏好</label>
          <input
            type="text"
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="例如：美食, 动漫, 亲子, 购物"
            disabled={loading}
          />
        </div>
        
        <div className="preference-tags">
          <span className="tags-label">快速选择偏好：</span>
          {['美食', '动漫', '亲子', '购物', '自然风光', '历史文化'].map(tag => (
            <button
              key={tag}
              type="button"
              className={`tag-button ${preferences.includes(tag) ? 'active' : ''}`}
              onClick={() => {
                if (preferences.includes(tag)) {
                  setPreferences(preferences.replace(tag, '').replace(/,\s*$|^\s*,|\s*,\s*/g, ' ').trim());
                } else {
                  setPreferences(preferences ? `${preferences}, ${tag}` : tag);
                }
              }}
              disabled={loading}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner">⟳</span>
              正在生成行程...
            </>
          ) : 'AI生成行程'}
        </button>
        
        <div className="note-section">
          <h4>💡 提示：</h4>
          <ul>
            <li>行程生成将使用AI大语言模型，需要几秒钟时间</li>
            <li>请确保目的地、日期等关键信息准确无误</li>
            <li>详细的偏好设置将帮助生成更符合你需求的行程</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default HomePage;