import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function BudgetPage() {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载预算数据
    setLoading(false);
    setBudget({
      id,
      destination: '北京',
      totalBudget: 5000,
      spent: 1200,
      remaining: 3800,
      categories: [
        { name: '交通', estimated: 800, actual: 300 },
        { name: '住宿', estimated: 2000, actual: 500 },
        { name: '餐饮', estimated: 1000, actual: 300 },
        { name: '门票', estimated: 600, actual: 100 },
        { name: '购物', estimated: 400, actual: 0 },
        { name: '其他', estimated: 200, actual: 0 }
      ]
    });
  }, [id]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="budget-page">
      <h1>{budget.destination} 预算管理</h1>
      
      <div className="budget-summary">
        <div className="summary-item">
          <h3>总预算</h3>
          <p className="amount">¥{budget.totalBudget}</p>
        </div>
        <div className="summary-item">
          <h3>已花费</h3>
          <p className="amount spent">¥{budget.spent}</p>
        </div>
        <div className="summary-item">
          <h3>剩余</h3>
          <p className="amount remaining">¥{budget.remaining}</p>
        </div>
      </div>

      <div className="budget-details">
        <h2>预算明细</h2>
        <table>
          <thead>
            <tr>
              <th>类别</th>
              <th>预算</th>
              <th>实际</th>
              <th>差异</th>
            </tr>
          </thead>
          <tbody>
            {budget.categories.map((category, index) => (
              <tr key={index}>
                <td>{category.name}</td>
                <td>¥{category.estimated}</td>
                <td>¥{category.actual}</td>
                <td className={category.actual > category.estimated ? 'over-budget' : 'under-budget'}>
                  ¥{category.estimated - category.actual}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BudgetPage;