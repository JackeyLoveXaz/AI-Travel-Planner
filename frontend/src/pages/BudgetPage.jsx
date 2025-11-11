import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBudgetByItineraryId, updateBudget, createBudget } from '../services/budgetService';
import { handleApiError, API_BASE_URL } from '../services/apiConfig';
import '../styles/BudgetPage.css';

const BudgetPage = () => {
  const { id, itineraryId } = useParams();
  // 优先使用itineraryId参数，如果不存在则使用id参数
  const actualItineraryId = itineraryId || id;
  const [budget, setBudget] = useState(null);
  const [estimatedBudget, setEstimatedBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    // 从API获取预算数据
    if (actualItineraryId) {
      console.log('加载行程ID:', actualItineraryId);
      loadBudget();
      fetchItineraryInfo(actualItineraryId);
    } else {
      setLoading(false);
    }
  }, [actualItineraryId]);

  // 获取行程信息，包括预算
  const fetchItineraryInfo = async (itineraryId) => {
    try {
      if (!itineraryId) {
        console.error('行程ID未提供');
        return null;
      }
      console.log('获取行程详情:', itineraryId);
      const response = await fetch(`${API_BASE_URL}/itineraries/${itineraryId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const result = data.data || data;
      
      // 从行程数据中提取预算信息
      if (result.days || result.dailySchedule) {
        const days = result.days || result.dailySchedule;
        console.log('处理行程天数:', days.length, '天');
        
        const estimatedBudget = days.reduce((total, day) => {
          if (day.dailyBudget) {
            console.log(`第${day.day || 'N/A'}天预算: ¥${day.dailyBudget}`);
            return total + day.dailyBudget;
          }
          // 如果没有dailyBudget字段，尝试从activities中计算
          const dayCost = (day.activities || []).reduce((dayTotal, activity) => {
            return dayTotal + (activity.cost || 0);
          }, 0);
          console.log(`第${day.day || 'N/A'}天活动成本合计: ¥${dayCost}`);
          return total + dayCost;
        }, 0);
        
        console.log('计算的总预估预算:', estimatedBudget);
        if (estimatedBudget > 0 && !budget) {
          // 如果有预估预算且当前没有预算数据，显示预估信息
          setEstimatedBudget(estimatedBudget);
        }
      }
      
      return result;
    } catch (error) {
      console.error('获取行程信息失败:', error);
      return null;
    }
  };
  
  const loadBudget = async () => {
    setLoading(true);
    setError('');
    try {
      if (!actualItineraryId) {
        setError('行程ID未提供');
        console.error('行程ID为undefined');
        // 加载模拟数据作为后备
        loadMockData();
        return;
      }
      
      const data = await getBudgetByItineraryId(actualItineraryId);
      
      // 立即设置预算数据，无论是否完整
      if (data && data._id) {
        console.log('成功获取到预算数据，设置到状态中:', data);
        setBudget(data);
      } else {
        // 没有返回有效数据或_id不存在，尝试创建默认预算
        console.log('未获取到有效预算数据，创建默认预算');
        // 获取行程信息，以获取预算值
        const itineraryInfo = await fetchItineraryInfo(actualItineraryId);
        let itineraryBudget = itineraryInfo ? itineraryInfo.budget : null;
        
        if (itineraryBudget) {
          console.log('使用行程中的预算值:', itineraryBudget);
          await createDefaultBudget(itineraryBudget);
        } else {
          // 没有行程预算，使用模拟数据
          loadMockData();
        }
      }
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
  
  // 创建默认预算
  const createDefaultBudget = async (totalBudget = null) => {
    try {
      if (!actualItineraryId) {
        throw new Error('请提供行程ID、目的地和总预算');
      }
      
      // 优先从会话存储获取预算值
      let budgetAmount;
      if (totalBudget) {
        budgetAmount = totalBudget;
      } else {
        // 尝试从会话存储中获取预算值
        const storedBudget = sessionStorage.getItem(`budget_${actualItineraryId}`);
        if (storedBudget) {
          budgetAmount = parseInt(storedBudget);
          if (!isNaN(budgetAmount) && budgetAmount > 0) {
            console.log('从会话存储中获取预算值:', budgetAmount);
          } else {
            budgetAmount = 5000; // 默认值
          }
        } else {
          budgetAmount = 5000; // 默认值
        }
      }
      
      // 根据预算值计算各类别的金额
      const calculateCategoryAmount = (percentage) => {
        return Math.round(budgetAmount * percentage / 100);
      };
      
      // 获取行程信息以获取目的地
      let destination = '未知目的地';
      const itineraryInfo = await fetchItineraryInfo(actualItineraryId);
      if (itineraryInfo && itineraryInfo.destination) {
        destination = itineraryInfo.destination;
      }
      
      // 创建一个默认预算
      const defaultBudget = {
        itineraryId: actualItineraryId,
        destination: destination,
        totalBudget: budgetAmount,
        categories: [
          { _id: 'cat-1', name: '交通', budget: calculateCategoryAmount(20), actual: 0 },
          { _id: 'cat-2', name: '住宿', budget: calculateCategoryAmount(40), actual: 0 },
          { _id: 'cat-3', name: '餐饮', budget: calculateCategoryAmount(20), actual: 0 },
          { _id: 'cat-4', name: '门票', budget: calculateCategoryAmount(10), actual: 0 },
          { _id: 'cat-5', name: '购物', budget: calculateCategoryAmount(6), actual: 0 },
          { _id: 'cat-6', name: '其他', budget: calculateCategoryAmount(4), actual: 0 }
        ]
      };
      
      // 调用API创建预算
      const createdBudget = await createBudget(
        actualItineraryId,
        defaultBudget.destination,
        defaultBudget.totalBudget,
        defaultBudget.categories
      );
      
      console.log('默认预算创建成功:', createdBudget);
      // 重新加载预算数据以获取服务器返回的完整信息
      const refreshedBudget = await getBudgetByItineraryId(actualItineraryId);
      setBudget(refreshedBudget);
    } catch (err) {
      console.error('创建默认预算失败:', err);
      // 如果创建失败，至少显示本地模拟数据
      loadMockData();
    }
  };

  // 加载模拟数据作为后备，根据行程ID返回对应的目的地预算
  const loadMockData = () => {
    // 基于行程ID返回对应目的地的预算数据
    let destinationBudget;
    
    // 根据行程ID匹配对应的目的地预算
    if (actualItineraryId === 'mock-1') { // 上海行程
      destinationBudget = {
        _id: 'mock-budget-' + actualItineraryId,
        itineraryId: actualItineraryId,
        destination: '上海',
        totalBudget: 6000, // 上海预算略高
        spent: 1500,
        remaining: 4500,
        categories: [
          { _id: 'cat-1', name: '交通', budget: 1200, actual: 300 }, // 上海交通成本较高
          { _id: 'cat-2', name: '住宿', budget: 2500, actual: 800 }, // 上海住宿较贵
          { _id: 'cat-3', name: '餐饮', budget: 1000, actual: 300 },
          { _id: 'cat-4', name: '门票', budget: 800, actual: 100 }, // 上海景点门票
          { _id: 'cat-5', name: '购物', budget: 300, actual: 0 },
          { _id: 'cat-6', name: '其他', budget: 200, actual: 0 }
        ]
      };
    } else if (actualItineraryId === 'mock-2') { // 北京行程
      destinationBudget = {
        _id: 'mock-budget-' + actualItineraryId,
        itineraryId: actualItineraryId,
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
      };
    } else { // 默认预算
      // 优先从会话存储中获取预算值
      let defaultBudgetAmount = 5000;
      
      // 优先从会话存储中获取预算值
      const storedBudget = sessionStorage.getItem(`budget_${actualItineraryId}`);
      if (storedBudget) {
        const parsedStoredBudget = parseInt(storedBudget);
        if (!isNaN(parsedStoredBudget) && parsedStoredBudget > 0) {
          defaultBudgetAmount = parsedStoredBudget;
          console.log('从会话存储获取默认预算值:', defaultBudgetAmount);
        }
      }
      
      // 如果会话存储中没有，检查URL参数
      if (defaultBudgetAmount === 5000) { // 只有当默认值仍为5000时才检查URL
        const urlParams = new URLSearchParams(window.location.search);
        const budgetParam = urlParams.get('budget');
        if (budgetParam) {
          const parsedBudget = parseInt(budgetParam);
          if (!isNaN(parsedBudget) && parsedBudget > 0) {
            defaultBudgetAmount = parsedBudget;
            console.log('从URL参数获取默认预算值:', defaultBudgetAmount);
          }
        }
      }
      
      destinationBudget = {
        _id: 'mock-budget-' + actualItineraryId,
        itineraryId: actualItineraryId,
        destination: '行程目的地',
        totalBudget: defaultBudgetAmount,
        spent: 0,
        remaining: defaultBudgetAmount,
        categories: [
          { _id: 'cat-1', name: '交通', budget: Math.round(defaultBudgetAmount * 0.3), actual: 0 },
          { _id: 'cat-2', name: '住宿', budget: Math.round(defaultBudgetAmount * 0.3), actual: 0 },
          { _id: 'cat-3', name: '餐饮', budget: Math.round(defaultBudgetAmount * 0.2), actual: 0 },
          { _id: 'cat-4', name: '活动', budget: Math.round(defaultBudgetAmount * 0.1), actual: 0 },
          { _id: 'cat-5', name: '购物', budget: Math.round(defaultBudgetAmount * 0.05), actual: 0 },
          { _id: 'cat-6', name: '其他', budget: Math.round(defaultBudgetAmount * 0.05), actual: 0 }
        ]
      };
    }
    
    setBudget(destinationBudget);
    return destinationBudget; // 返回模拟数据以便其他函数使用
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
      console.log('准备更新预算，发送的数据:', {
        itineraryId: actualItineraryId,
        totalBudget: budget.totalBudget,
        categories: updatedCategories,
        spent: spent,
        remaining: remaining
      });
      // 传递完整的预算数据，确保totalBudget也被保存
      const response = await updateBudget(actualItineraryId, {
        totalBudget: budget.totalBudget,
        categories: updatedCategories,
        spent: spent,
        remaining: remaining
      });
      console.log('预算更新成功，后端返回结果:', response);
      console.log('预算更新成功，实际花费已保存:', newActual);
      setEditingCategory(null);
    } catch (err) {
      console.error('预算更新失败:', err);
      console.error('错误详情:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setError(handleApiError(err));
      // 如果API调用失败，恢复到之前的状态
      loadBudget();
    }
  };

  const getPercentage = (actual, budget) => {
    if (!budget || budget === 0) return 0;
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
          <Link to={`/itinerary/${actualItineraryId}`} className="back-to-list">
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
        {estimatedBudget > 0 && (
          <div className="estimated-budget-notice">
            <p className="notice-text">
              <strong>AI 预估预算：¥{estimatedBudget.toLocaleString()}</strong> - 基于您的行程活动自动计算
            </p>
          </div>
        )}
        <div className="budget-summary">
          <div className="summary-item">
            <span className="label">总预算</span>
            <span className="value">¥{(budget?.totalBudget || 0).toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">已花费</span>
            <span className="value spent">¥{(budget?.spent || 0).toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">剩余</span>
            <span className="value remaining">¥{(budget?.remaining || 0).toLocaleString()}</span>
          </div>
        </div>

        {budget && budget.totalBudget > 0 && (
          <div className="budget-progress">
            <div 
              className="progress-bar"
              style={{
                width: `${getPercentage(budget.spent, budget.totalBudget)}%`
              }}
            ></div>
          </div>
        )}
      </div>

      <div className="budget-categories">
        <h2>预算分类</h2>
        {budget.categories && budget.categories.length > 0 ? (
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
                const categoryBudget = category.budget !== undefined ? category.budget : category.estimated;
                const percentage = getPercentage(category.actual, categoryBudget);
                const remaining = categoryBudget - category.actual;
                
                return (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>¥{((category.budget !== undefined ? category.budget : category.estimated) || 0).toLocaleString()}</td>
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
                        <span>¥{(category.actual || 0).toLocaleString()}</span>
                      )}
                    </td>
                    <td className={remaining < 0 ? 'over-budget' : ''}>
                      <span>¥{(remaining || 0).toLocaleString()}</span>
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
        ) : (
          <div className="empty-categories">
            <p>暂无预算分类信息</p>
            <button 
              className="refresh-button" 
              onClick={loadBudget}
            >
              重新加载预算
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetPage;