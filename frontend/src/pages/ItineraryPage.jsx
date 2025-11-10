import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function ItineraryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载行程数据
    setLoading(false);
    setItinerary({
      id,
      destination: '北京',
      startDate: '2024-07-15',
      endDate: '2024-07-20',
      days: [
        {
          day: 1,
          activities: [
            { time: '09:00', activity: '参观故宫博物院' },
            { time: '14:00', activity: '游览天安门广场' },
            { time: '18:00', activity: '王府井步行街晚餐' }
          ]
        },
        {
          day: 2,
          activities: [
            { time: '09:00', activity: '登长城' },
            { time: '16:00', activity: '返回市区' }
          ]
        }
      ]
    });
  }, [id]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="itinerary-page">
      <h1>{itinerary.destination} 行程安排</h1>
      <div className="itinerary-info">
        <p>日期: {itinerary.startDate} 至 {itinerary.endDate}</p>
        <button onClick={() => navigate(`/budget/${id}`)}>查看预算</button>
      </div>
      
      <div className="itinerary-days">
        {itinerary.days.map(day => (
          <div key={day.day} className="day-container">
            <h2>第 {day.day} 天</h2>
            <div className="activities">
              {day.activities.map((activity, index) => (
                <div key={index} className="activity">
                  <span className="time">{activity.time}</span>
                  <span className="description">{activity.activity}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ItineraryPage;