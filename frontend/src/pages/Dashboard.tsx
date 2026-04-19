import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../lib/api';

interface DashboardData {
  clients: number;
  budgets: { total: number; approved: number; value: number };
  orders: { total: number; value: number };
  financial: { income: number; expenses: number; profit: number; pendingReceivable: number };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentBudgets, setRecentBudgets] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, budgetsRes, ordersRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/budgets'),
        api.get('/orders')
      ]);
      setData(dashRes.data);
      setRecentBudgets((budgetsRes.data || []).slice(0, 5));
      setRecentOrders((ordersRes.data || []).slice(0, 5));
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-gray-500">
          <div className="text-5xl mb-4">📊</div>
          <p>Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Clientes',
      value: data.clients,
      icon: '👥',
      color: 'blue',
      change: '+12%',
      positive: true
    },
    {
      label: 'Orçamentos',
      value: data.budgets.total,
      sublabel: `${data.budgets.approved} aprovados`,
      icon: '📋',
      color: 'purple',
      value2: `R$ ${(data.budgets.value / 1000).toFixed(1)}k`
    },
    {
      label: 'Pedidos',
      value: data.orders.total,
      icon: '📦',
      color: 'green',
      value2: `R$ ${(data.orders.value / 1000).toFixed(1)}k`
    },
    {
      label: 'Faturamento',
      value: `R$ ${(data.financial.income / 1000).toFixed(1)}k`,
      icon: '💰',
      color: 'emerald',
      change: '+8%',
      positive: true
    }
  ];

  const statusConfig: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: '#F0F2F5', text: '#718096' },
    SENT: { bg: '#E3F2FD', text: '#1976D2' },
    APPROVED: { bg: '#E8F5E9', text: '#388E3C' },
    REJECTED: { bg: '#FFEBEE', text: '#D32F2F' },
    PENDING: { bg: '#FFF3E0', text: '#F57C00' },
    IN_PRODUCTION: { bg: '#E3F2FD', text: '#1976D2' },
    READY: { bg: '#E8F5E9', text: '#388E3C' },
    COMPLETED: { bg: '#F5F5F5', text: '#616161' }
  };

  return (
    <div className="animate-fadeIn">
      {/* Saudação */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Olá, bom dia! 👋
        </h2>
        <p className="text-gray-600 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' ? 'primary' : ''}`}
            style={{
              background: kpi.color === 'blue' ? 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)' :
                         kpi.color === 'purple' ? 'linear-gradient(135deg, #7E57C2 0%, #5E35B1 100%)' :
                         kpi.color === 'emerald' ? 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)' :
                         kpi.color === 'green' ? 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' : '#FFFFFF',
              ...(kpi.color !== 'blue' && kpi.color !== 'purple' && kpi.color !== 'emerald' && kpi.color !== 'green' ? { 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
              } : {})
            }}
          >
            <div className="kpi-icon" style={{
              background: kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' || kpi.color === 'green' 
                ? 'rgba(255,255,255,0.2)' 
                : '#F5F7FA'
            }}>
              {kpi.icon}
            </div>
            <div className="kpi-label" style={{
              color: kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' || kpi.color === 'green'
                ? 'rgba(255,255,255,0.8)'
                : '#718096'
            }}>
              {kpi.label}
            </div>
            <div className="kpi-value" style={{
              color: kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' || kpi.color === 'green'
                ? '#FFFFFF'
                : '#1A202C'
            }}>
              {kpi.value}
            </div>
            {kpi.sublabel && (
              <div className="text-sm mt-1" style={{
                color: kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' || kpi.color === 'green'
                  ? 'rgba(255,255,255,0.7)'
                  : '#718096'
              }}>
                {kpi.sublabel}
              </div>
            )}
            {kpi.value2 && (
              <div className="text-lg font-semibold mt-1" style={{
                color: kpi.color === 'blue' || kpi.color === 'purple' || kpi.color === 'emerald' || kpi.color === 'green'
                  ? 'rgba(255,255,255,0.9)'
                  : '#1A202C'
              }}>
                {kpi.value2}
              </div>
            )}
            {kpi.change && (
              <div className={`kpi-change ${kpi.positive ? 'positive' : 'negative'}`} style={{
                background: kpi.positive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.2)',
                color: '#FFFFFF'
              }}>
                {kpi.positive ? '↑' : '↓'} {kpi.change}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Resumo Financeiro */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💳 Resumo Financeiro</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#E8F5E9' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#2E7D32' }}>Receitas</p>
                <p className="text-xl font-bold" style={{ color: '#1B5E20' }}>
                  R$ {data.financial.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-2xl">📈</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#FFEBEE' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#C62828' }}>Despesas</p>
                <p className="text-xl font-bold" style={{ color: '#B71C1C' }}>
                  R$ {data.financial.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-2xl">📉</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border-2" style={{ background: '#E3F2FD', borderColor: '#1976D2' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1976D2' }}>Lucro</p>
                <p className="text-2xl font-bold" style={{ color: '#0D47A1' }}>
                  R$ {data.financial.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-3xl">💵</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#FFF8E1' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F57C00' }}>A Receber</p>
                <p className="text-lg font-bold" style={{ color: '#E65100' }}>
                  R$ {data.financial.pendingReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Últimos Orçamentos */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="card-title">📋 Últimos Orçamentos</h3>
            <button className="btn btn-sm btn-ghost">Ver todos →</button>
          </div>
          <div className="divide-y" style={{ borderColor: '#E2E8F0' }}>
            {recentBudgets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>Nenhum orçamento ainda</p>
              </div>
            ) : recentBudgets.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: '#E3F2FD' }}>
                    📄
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.number}</p>
                    <p className="text-sm text-gray-500">
                      {b.client?.name || 'Sem cliente'} • {format(new Date(b.createdAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R$ {Number(b.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span 
                    className="status-pill info text-xs"
                    style={{
                      background: statusConfig[b.status]?.bg || '#F0F2F5',
                      color: statusConfig[b.status]?.text || '#718096'
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pedidos Recentes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🚚 Pedidos em Andamento</h3>
          <button className="btn btn-sm btn-ghost">Ver todos →</button>
        </div>
        <div className="table-container" style={{ boxShadow: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p>Nenhum pedido ainda</p>
                  </td>
                </tr>
              ) : recentOrders.map(o => (
                <tr key={o.id}>
                  <td className="font-semibold">{o.number}</td>
                  <td>{o.client?.name || 'Sem cliente'}</td>
                  <td className="font-bold">
                    R$ {Number(o.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span 
                      className="status-pill"
                      style={{
                        background: statusConfig[o.status]?.bg || '#F0F2F5',
                        color: statusConfig[o.status]?.text || '#718096'
                      }}
                    >
                      {o.status === 'IN_PRODUCTION' ? 'Em Produção' : o.status}
                    </span>
                  </td>
                  <td className="text-gray-500">
                    {o.deliveryDate ? format(new Date(o.deliveryDate), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { icon: '🧮', label: 'Calculadora', desc: 'Calcular custo', color: '#E3F2FD' },
          { icon: '📋', label: 'Orçamento', desc: 'Novo orçamento', color: '#E8F5E9' },
          { icon: '👤', label: 'Cliente', desc: 'Novo cliente', color: '#FFF3E0' },
          { icon: '📦', label: 'Pedido', desc: 'Novo pedido', color: '#F3E5F5' },
        ].map((action, i) => (
          <button 
            key={i}
            className="card p-4 text-center hover:shadow-lg transition-all cursor-pointer"
            style={{ border: 'none' }}
          >
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3"
              style={{ background: action.color }}
            >
              {action.icon}
            </div>
            <p className="font-semibold text-gray-900">{action.label}</p>
            <p className="text-xs text-gray-500">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
