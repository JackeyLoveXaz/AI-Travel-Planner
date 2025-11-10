import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">AI旅行规划师</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/" className="nav-item">首页</Link>
        <Link to="/dashboard" className="nav-item">仪表盘</Link>
        <Link to="/itinerary" className="nav-item">行程规划</Link>
        <Link to="/budget" className="nav-item">预算管理</Link>
        <Link to="/settings" className="nav-item">设置</Link>
        <Link to="/connection-test" className="nav-item">连接测试</Link>
      </div>
    </nav>
  );
}

export default Navbar;