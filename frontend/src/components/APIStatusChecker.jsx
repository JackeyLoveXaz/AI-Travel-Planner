import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../utils/apiTester';
import '../styles/APIStatusChecker.css';

const APIStatusChecker = () => {
  const [status, setStatus] = useState('checking'); // checking, connected, disconnected
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await testApiConnection();
      setStatus(result.success ? 'connected' : 'disconnected');
      setTestResults(result);
    } catch (err) {
      setStatus('disconnected');
      setError(err.message);
    }
  };

  const runFullTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await testApiConnection();
      setTestResults(result);
      setStatus(result.success ? 'connected' : 'disconnected');
      
      // 同时在控制台输出详细信息
      console.log('\n🔍 API连接测试结果:');
      console.log(result);
    } catch (err) {
      setError('测试失败: ' + err.message);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-status-container">
      <div className="api-status-header">
        <span className={`status-indicator ${status}`}>
          {status === 'checking' ? '⏳' : status === 'connected' ? '✅' : '❌'}
        </span>
        <span className="status-text">
          {status === 'checking' ? '正在检查连接...' : 
           status === 'connected' ? 'API连接正常' : 'API连接失败'}
        </span>
        <button 
          className="test-button"
          onClick={runFullTest}
          disabled={loading}
        >
          {loading ? '测试中...' : '运行完整测试'}
        </button>
      </div>

      {testResults && (
        <div className="test-results">
          <h4>测试详情</h4>
          
          <div className="result-section">
            <strong>基础连接:</strong>
            <span className={testResults.success ? 'success' : 'error'}>
              {testResults.success ? '成功' : '失败'}
            </span>
          </div>

          {testResults.details && testResults.details.itineraryApi && (
            <div className="result-section">
              <strong>行程API:</strong>
              <span className={testResults.details.itineraryApi.isConnected ? 'success' : 'error'}>
                ${testResults.details.itineraryApi.status}
              </span>
            </div>
          )}

          {testResults.details && testResults.details.budgetApi && (
            <div className="result-section">
              <strong>预算API:</strong>
              <span className={testResults.details.budgetApi.isConnected ? 'success' : 'error'}>
                ${testResults.details.budgetApi.status}
              </span>
            </div>
          )}

          {!testResults.success && testResults.details && testResults.details.possibleSolutions && (
            <div className="solutions-section">
              <h5>可能的解决方法:</h5>
              <ul>
                {testResults.details.possibleSolutions.map((solution, index) => (
                  <li key={index}>${solution}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">${error}</div>
      )}
    </div>
  );
};

export default APIStatusChecker;