import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBudgetByItineraryId, updateBudget } from '../services/budgetService';
import { handleApiError } from '../services/apiConfig';
import '../styles/BudgetPage.css';

const BudgetPage = () => {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    // 从API获取预算数据
    loadBudget();
  }, [id]);

  const loadBudget = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBudgetByItineraryId(id);
      setBudget(data);
    } catch (err) {
      setError(handleApiError(err));
      // 显示错误信息，但保留模拟数据以便用户体验
      console.error('加载预算失败，显示模拟数据:', err);
      // 加载模拟数据作为后备
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // 加载模拟数据作为后备
  const loadMockData = () => {
    setBudget({
      _id: 'mock-budget-' + id,
      itineraryId: id,
      destination: '北京',
      totalBudget: 5000,
      spent: 1200,
      remaining: 3800,
      categories: [
        { _id: 'cat-1', name: '交通', budget: 800, actual: 300 },
        { _id: 'cat-2', name: '住宿', budget: 2000, actual: 500 },
        { _id: 'cat-3', name: '餐饮', budget: 1000, actual: 300 },
        { _id: 'cat-4', name: '门票', budget: 600, actual: 100 },
        { _id: 'cat-5', name: '购物', budget: 400, actual: 0 },
        { _id: 'cat-6', name: '其他', budget: 200, actual: 0 }
      ]
    });
  };

  const updateCategoryActual = async (categoryId, value) => {
    const newActual = parseFloat(value) || 0;
    const updatedCategories = budget.categories.map(category =>
      category._id === categoryId ? { ...category, actual: newActual } : category
    );
    
    const spent = updatedCategories.reduce((sum, category) => sum + (category.actual || 0), 0);
    const remaining = budget.totalBudget - spent;
    
    // 先更新本地状态以提供即时反馈
    const updatedBudget = {
      ...budget,
      categories: updatedCategories,
      spent,
      remaining
    };
    setBudget(updatedBudget);
    
    // 然后调用API更新服务器数据
    try {
      await updateBudget(id, {
        categories: updatedCategories
      });
      setEditingCategory(null);
    } catch (err) {
      setError(handleApiError(err));
      // 如果API调用失败，恢复到之前的状态
      loadBudget();
    }
  };

  const getPercentage = (actual, budget) => {
    if (budget === 0) return 0;
    return Math.round((actual / budget) * 100);
  };

  const handleEdit = (categoryId) => {
    setEditingCategory(categoryId);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="budget-container">
        <div className="loading-container">
          <span className="loading-spinner">⟳</span>
          <div className="loading-text">加载预算中...</div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="budget-container">
        <div className="error-message">无法加载预算数据</div>
        <Link to="/itineraries" className="back-to-list">返回行程列表</Link>
      </div>
    );
  }

  return (
    <div className="budget-container">
      <header className="page-header">
        <h1>{budget.destination} 预算管理</h1>
        <div className="header-actions">
          <button 
            className="refresh-button" 
            onClick={loadBudget}
          >
            刷新
          </button>
          <Link to={`/itinerary/${id}`} className="back-to-list">
            返回行程
          </Link>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="budget-overview">
        <div className="budget-summary">
          <div className="summary-item">
            <span className="label">总预算</span>
            <span className="value">¥{budget.totalBudget.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">已花费</span>
            <span className="value spent">¥{budget.spent.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">剩余</span>
            <span className="value remaining">¥{budget.remaining.toLocaleString()}</span>
          </div>
        </div>

        <div className="budget-progress">
          <div 
            className="progress-bar"
            style={{
              width: `${getPercentage(budget.spent, budget.totalBudget)}%`
            }}
          ></div>
        </div>
      </div>

      <div className="budget-categories">
        <h2>预算分类</h2>
        <table className="category-table">
          <thead>
            <tr>
              <th>类别</th>
              <th>预算金额</th>
              <th>实际花费</th>
              <th>剩余金额</th>
              <th>使用百分比</th>
              <th>进度条</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {budget.categories.map(category => {
              const percentage = getPercentage(category.actual, category.budget);
              const remaining = category.budget - category.actual;
              
              return (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>¥{category.budget.toLocaleString()}</td>
                  <td>
                    {editingCategory === category._id ? (
                      <div className="edit-controls">
                        <input
                          type="number"
                          value={category.actual}
                          onChange={(e) => {
                            const tempCategories = budget.categories.map(cat =>
                              cat._id === category._id ? { ...cat, actual: parseFloat(e.target.value) || 0 } : cat
                            );
                            setBudget({ ...budget, categories: tempCategories });
                          }}
                          className="actual-input"
                          autoFocus
                        />
                        <button 
                          className="save-button"
                          onClick={() => updateCategoryActual(category._id, category.actual)}
                        >
                          保存
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={handleCancelEdit}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <span>¥{category.actual.toLocaleString()}</span>
                    )}
                  </td>
                  <td className={remaining < 0 ? 'over-budget' : ''}>
                    <span>¥{remaining.toLocaleString()}</span>
                  </td>
                  <td className={percentage > 100 ? 'over-budget' : ''}>{percentage}%</td>
                  <td>
                    <div className="category-progress">
                      <div 
                        className={`progress-bar ${percentage > 100 ? 'over-budget' : ''}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <button 
                        className="edit-button"
                        onClick={() => handleEdit(category._id)}
                      >
                        编辑
                      </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BudgetPage;