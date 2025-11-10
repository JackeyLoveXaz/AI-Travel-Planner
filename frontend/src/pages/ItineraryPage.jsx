import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllItineraries, deleteItinerary } from '../services/itineraryService';
import { handleApiError } from '../services/apiConfig';
import '../styles/ItineraryPage.css';

const ItineraryPage = () => {
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 从API获取行程数据
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllItineraries();
      setItineraries(data);
    } catch (err) {
      setError(handleApiError(err));
      // 显示错误信息，但保留模拟数据以便用户体验
      console.error('加载行程失败，显示模拟数据:', err);
      // 加载模拟数据作为后备
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // 加载模拟数据作为后备
  const loadMockData = () => {
    const mockItineraries = [
      {
        _id: 'mock-1',
        destination: '上海',
        startDate: '2024-01-20',
        endDate: '2024-01-25',
        days: [
          {
            day: 1,
            activities: [
              { time: '09:00', activity: '抵达上海浦东国际机场', notes: '提前2小时到达机场办理登机手续' },
              { time: '12:00', activity: '入住酒店', notes: '上海外滩华尔道夫酒店' },
              { time: '14:00', activity: '游览外滩', notes: '欣赏黄浦江两岸风光' },
              { time: '18:00', activity: '晚餐：上海老饭店', notes: '品尝正宗上海本帮菜' }
            ]
          },
          {
            day: 2,
            activities: [
              { time: '10:00', activity: '上海博物馆', notes: '提前预约，周一闭馆' },
              { time: '12:30', activity: '午餐：南京东路小吃', notes: '生煎包、小笼包' },
              { time: '14:30', activity: '豫园', notes: '江南古典园林' },
              { time: '19:00', activity: '登东方明珠塔', notes: '俯瞰上海夜景' }
            ]
          }
        ]
      },
      {
        _id: 'mock-2',
        destination: '北京',
        startDate: '2024-02-10',
        endDate: '2024-02-15',
        days: [
          {
            day: 1,
            activities: [
              { time: '10:00', activity: '抵达北京首都国际机场', notes: '机场快轨直达市区' },
              { time: '12:30', activity: '入住酒店', notes: '王府井希尔顿酒店' },
              { time: '14:00', activity: '王府井步行街', notes: '购物和小吃' },
              { time: '18:00', activity: '晚餐：全聚德烤鸭店', notes: '推荐前门店' }
            ]
          }
        ]
      }
    ];
    setItineraries(mockItineraries);
  };

  const handleViewDetail = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedItinerary(null);
  };

  const handleDelete = async (itineraryId) => {
    if (window.confirm('确定要删除这个行程吗？')) {
      try {
        await deleteItinerary(itineraryId);
        setItineraries(itineraries.filter(item => item._id !== itineraryId));
        if (showDetail && selectedItinerary._id === itineraryId) {
          handleBackToList();
        }
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return duration;
  };

  // 刷新行程列表
  const handleRefresh = () => {
    loadItineraries();
  };

  return (
    <div className="itinerary-container">
      <header className="page-header">
        <h1>我的行程</h1>
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新'}
          </button>
          <Link to="/" className="btn-primary">
            创建新行程
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!showDetail ? (
        <div className="itinerary-list">
          <h2>行程列表</h2>
          {loading ? (
            <p className="loading-message">加载行程中...</p>
          ) : itineraries.length === 0 ? (
            <p className="empty-message">暂无行程，快去创建你的第一个旅行计划吧！</p>
          ) : (
            <div className="itinerary-cards">
              {itineraries.map((itinerary) => (
                <div key={itinerary._id} className="itinerary-card">
                  <h3>{itinerary.destination}</h3>
                  <div className="itinerary-dates">
                    <span>{formatDate(itinerary.startDate)}</span>
                    <span> - </span>
                    <span>{formatDate(itinerary.endDate)}</span>
                    <span className="duration">  {calculateDuration(itinerary.startDate, itinerary.endDate)}天</span>
                  </div>
                  <div className="itinerary-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => handleViewDetail(itinerary)}
                    >
                      查看详情
                    </button>
                    <button 
                      className="btn-danger" 
                      onClick={() => handleDelete(itinerary._id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="itinerary-detail">
          <button className="btn-back" onClick={handleBackToList}>
            ← 返回列表
          </button>
          <h2>{selectedItinerary.destination} 行程</h2>
          <div className="itinerary-info">
            <div className="itinerary-dates">
              <span>{formatDate(selectedItinerary.startDate)}</span>
              <span> - </span>
              <span>{formatDate(selectedItinerary.endDate)}</span>
              <span className="duration">  {calculateDuration(selectedItinerary.startDate, selectedItinerary.endDate)}天</span>
            </div>
            <button 
              className="btn-danger" 
              onClick={() => handleDelete(selectedItinerary._id)}
            >
              删除行程
            </button>
          </div>
          
          <div className="itinerary-days">
            {selectedItinerary.days.map(day => (
              <div key={day.day} className="day-container">
                <h3>第 {day.day} 天</h3>
                <div className="activities">
                  {day.activities.map((activity, index) => (
                    <div key={index} className="activity">
                      <span className="time">{activity.time}</span>
                      <span className="description">{activity.activity}</span>
                      {activity.notes && <span className="notes">{activity.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryPage;