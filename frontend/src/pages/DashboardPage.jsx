import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/DashboardPage.css';

function DashboardPage() {
  // 模拟数据 - 真实应用中会从API获取
  const recentItineraries = [
    {
      id: 'it1',
      destination: '日本东京',
      date: '2024-06-01 ~ 2024-06-07',
      status: '已完成'
    },
    {
      id: 'it2',
      destination: '上海',
      date: '2024-07-15 ~ 2024-07-18',
      status: '计划中'
    }
  ];

  return (
    <div className="dashboard-page">
      <h1>旅行仪表盘</h1>
      
      <div className="dashboard-overview">
        <div className="stat-card">
          <h3>总行程数</h3>
          <div className="stat-number">12</div>
        </div>
        <div className="stat-card">
          <h3>已完成行程</h3>
          <div className="stat-number">8</div>
        </div>
        <div className="stat-card">
          <h3>计划中行程</h3>
          <div className="stat-number">4</div>
        </div>
        <div className="stat-card">
          <h3>节省预算</h3>
          <div className="stat-number">¥23,500</div>
        </div>
      </div>

      <div className="recent-itineraries">
        <h2>近期行程</h2>
        {recentItineraries.length > 0 ? (
          <div className="itinerary-list">
            {recentItineraries.map(itinerary => (
              <div key={itinerary.id} className="itinerary-card">
                <div className="itinerary-header">
                  <h3>{itinerary.destination}</h3>
                  <span className={`status-badge status-${itinerary.status === '已完成' ? 'completed' : 'planned'}`}>
                    {itinerary.status}
                  </span>
                </div>
                <div className="itinerary-date">{itinerary.date}</div>
                <div className="itinerary-actions">
                  <Link to={`/itinerary/${itinerary.id}`} className="btn-view">
                    查看详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>您还没有任何行程</p>
            <Link to="/" className="btn-create">
              创建新行程
            </Link>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>快速操作</h2>
        <div className="action-buttons">
          <Link to="/" className="action-button primary">
            <span className="action-icon">+</span>
            <span>创建新行程</span>
          </Link>
          <Link to="/itineraries" className="action-button">
            <span className="action-icon">💰</span>
            <span>预算管理</span>
          </Link>
          <Link to="/settings" className="action-button">
            <span className="action-icon">⚙️</span>
            <span>个人设置</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;