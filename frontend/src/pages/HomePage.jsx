import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // 在实际应用中，这里会调用API创建行程
    const newItineraryId = '1'; // 模拟ID
    navigate(`/itinerary/${newItineraryId}`);
  };

  return (
    <div className="home-page">
      <h1>AI旅行规划师</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="destination">目的地</label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="startDate">开始日期</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">结束日期</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          生成行程
        </button>
      </form>
    </div>
  );
}

export default HomePage;