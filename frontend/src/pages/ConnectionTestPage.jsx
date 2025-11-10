import React, { useState } from 'react';
import { runFullConnectionTest } from '../services/apiTester';
import '../styles/ConnectionTestPage.css';

const ConnectionTestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestTime, setLastTestTime] = useState(null);

  const handleTestClick = async () => {
    setIsLoading(true);
    try {
      const results = await runFullConnectionTest();
      setTestResults(results);
      setLastTestTime(new Date().toLocaleString());
    } catch (error) {
      console.error('测试失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success === null) return null;
    return success ? 
      <span className="status-icon success">✓</span> : 
      <span className="status-icon error">✗</span>;
  };

  const formatLatency = (latency) => {
    if (latency === undefined) return '-';
    return `${latency}ms`;
  };

  return (
    <div className="connection-test-page">
      <h1>连接测试</h1>
      <p className="description">测试与后端API、数据库和OpenAI服务的连接状态</p>
      
      <div className="test-controls">
        <button 
          className="test-button" 
          onClick={handleTestClick}
          disabled={isLoading}
        >
          {isLoading ? '测试中...' : '运行测试'}
        </button>
        {lastTestTime && (
          <p className="last-test-time">上次测试: {lastTestTime}</p>
        )}
      </div>

      {testResults && (
        <div className="test-results">
          <div className="summary">
            <h2>测试结果摘要</h2>
            <div className="summary-status">
              <span className={`overall-status ${testResults.allSuccessful ? 'success' : 'error'}`}>
                {testResults.allSuccessful ? '所有连接正常' : '存在连接问题'}
              </span>
            </div>
          </div>

          <div className="test-details">
            <div className="test-section">
              <h3>API服务</h3>
              <div className="status-row">
                <span className="status-label">状态:</span>
                <span className={`status-value ${testResults.service.success ? 'success' : 'error'}`}>
                  {getStatusIcon(testResults.service.success)} {testResults.service.success ? '正常' : '异常'}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">延迟:</span>
                <span className="status-value">{formatLatency(testResults.service.latency)}</span>
              </div>
              {!testResults.service.success && (
                <div className="error-message">
                  错误: {testResults.service.error}
                </div>
              )}
            </div>

            <div className="test-section">
              <h3>数据库连接</h3>
              <div className="status-row">
                <span className="status-label">状态:</span>
                <span className={`status-value ${testResults.database.success ? 'success' : 'error'}`}>
                  {getStatusIcon(testResults.database.success)} {testResults.database.success ? '正常' : '异常'}
                </span>
              </div>
              {testResults.database.success && testResults.database.data && (
                <div className="status-row">
                  <span className="status-label">主机:</span>
                  <span className="status-value">{testResults.database.data.host || '-'}</span>
                </div>
              )}
              {!testResults.database.success && (
                <div className="error-message">
                  错误: {testResults.database.error || '连接失败'}
                </div>
              )}
            </div>

            <div className="test-section">
              <h3>OpenAI API</h3>
              <div className="status-row">
                <span className="status-label">状态:</span>
                <span className={`status-value ${testResults.openai.success ? 'success' : 'error'}`}>
                  {getStatusIcon(testResults.openai.success)} {testResults.openai.success ? '正常' : '异常'}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">API密钥:</span>
                <span className={`status-value ${testResults.openai.data?.apiKeyValid ? 'success' : 'error'}`}>
                  {testResults.openai.data?.apiKeyValid ? '有效' : '无效或未配置'}
                </span>
              </div>
              {!testResults.openai.success && (
                <div className="error-message">
                  错误: {testResults.openai.error || '连接失败'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="help-section">
        <h3>帮助信息</h3>
        <ul>
          <li>如果API服务连接失败，请确保后端服务正在运行</li>
          <li>如果数据库连接失败，请检查MongoDB服务是否启动</li>
          <li>如果OpenAI API连接失败，请检查API密钥是否正确配置</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTestPage;