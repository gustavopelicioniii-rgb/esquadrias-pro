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
      <div className="flex items-center justify-center" style={{ padding: '80px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3 className="empty-state-title">Erro ao carregar</h3>
        <p className="empty-state-text">Tente novamente mais tarde</p>
      </div>
    );
  }

  const statusConfig: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    PENDING: 'Pendente',
    IN_PRODUCTION: 'Em Produção',
    READY: 'Pronto',
    COMPLETED: 'Concluído',
  };

  const statusStyle: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: '#F4F7FE', color: '#A3AED0' },
    SENT: { bg: '#E6F2FF', color: '#0070E0' },
    APPROVED: { bg: '#E6FAF5', color: '#00A67E' },
    REJECTED: { bg: '#FEEFEE', color: '#EE5D50' },
    PENDING: { bg: '#FFF5E6', color: '#CC8400' },
    IN_PRODUCTION: { bg: '#E6F2FF', color: '#0070E0' },
    READY: { bg: '#E6FAF5', color: '#00A67E' },
    COMPLETED: { bg: '#F4F7FE', color: '#A3AED0' },
  };

  return (
    <div className="animate-fadeIn">
      {/* Saudação */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold" style={{ color: '#1B2559' }}>
          Olá, bom dia! 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: '#A3AED0' }}>
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards - Grid 4 colunas */}
      <div className="grid grid-4 mb-4">
        {/* Vendas - Card Azul Gradiente */}
        <div className="card kpi-card blue" style={{ padding: '24px' }}>
          <div className="kpi-card-icon">📈</div>
          <div className="kpi-label">Clientes</div>
          <div className="kpi-value">{data.clients}</div>
          <div className="kpi-change positive">+12%</div>
        </div>

        {/* Obras Entregues */}
        <div className="card kpi-card">
          <div className="kpi-card-icon">🏠</div>
          <div className="kpi-label">ORÇAMENTOS</div>
          <div className="kpi-value">{data.budgets.total}</div>
          <div className="kpi-change up">↑ 8%</div>
        </div>

        {/* Propostas */}
        <div className="card kpi-card">
          <div className="kpi-card-icon">📋</div>
          <div className="kpi-label">PEDIDOS</div>
          <div className="kpi-value">{data.orders.total}</div>
          <div className="kpi-change up">↑ 5%</div>
        </div>

        {/* Carteira */}
        <div className="card kpi-card">
          <div className="kpi-card-icon">💰</div>
          <div className="kpi-label">FATURAMENTO</div>
          <div className="kpi-value" style={{ fontSize: '20px' }}>
            R$ {(data.financial.income / 1000).toFixed(1)}k
          </div>
          <div className="kpi-change up">↑ 3%</div>
        </div>
      </div>

      {/* Grid 2 colunas */}
      <div className="grid grid-2 mb-4">
        {/* Resumo Financeiro */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">💳 Resumo Financeiro</h3>
            <span className="card-action">Ver mais →</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#E6FAF5' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#00A67E' }}>Receitas</p>
                <p className="text-lg font-bold" style={{ color: '#00A67E' }}>
                  R$ {data.financial.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span style={{ fontSize: '24px' }}>📈</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#FEEFEE' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#EE5D50' }}>Despesas</p>
                <p className="text-lg font-bold" style={{ color: '#EE5D50' }}>
                  R$ {data.financial.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span style={{ fontSize: '24px' }}>📉</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#E6F2FF', border: '2px solid #0070E0' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#0070E0' }}>Lucro</p>
                <p className="text-xl font-bold" style={{ color: '#0070E0' }}>
                  R$ {data.financial.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span style={{ fontSize: '28px' }}>💵</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#FFF5E6' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#CC8400' }}>A Receber</p>
                <p className="text-base font-bold" style={{ color: '#CC8400' }}>
                  R$ {data.financial.pendingReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span style={{ fontSize: '24px' }}>⏳</span>
            </div>
          </div>
        </div>

        {/* Últimos Orçamentos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
            <h3 className="card-title">📋 Últimos Orçamentos</h3>
            <span className="card-action">Ver todos →</span>
          </div>
          
          <div>
            {recentBudgets.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📋</div>
                <h3 className="empty-state-title">Nenhum orçamento</h3>
              </div>
            ) : recentBudgets.map((b) => (
              <div 
                key={b.id} 
                className="flex items-center justify-between p-4"
                style={{ borderBottom: '1px solid #E2E8F0' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: '44px', height: '44px', background: '#F4F7FE', fontSize: '20px' }}
                  >
                    📄
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1B2559' }}>{b.number}</p>
                    <p className="text-xs" style={{ color: '#A3AED0' }}>
                      {b.client?.name || 'Sem cliente'} • {format(new Date(b.createdAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: '#1B2559' }}>
                    R$ {Number(b.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span 
                    className="status-pill"
                    style={{ 
                      background: statusStyle[b.status]?.bg || '#F4F7FE',
                      color: statusStyle[b.status]?.color || '#A3AED0',
                      fontSize: '9px',
                      padding: '3px 8px'
                    }}
                  >
                    {statusConfig[b.status] || b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 className="card-title">🚚 Pedidos em Andamento</h3>
          <span className="card-action">Ver todos →</span>
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
                  <td colSpan={5} className="text-center" style={{ padding: '40px' }}>
                    <div className="empty-state-icon">📦</div>
                    <p className="empty-state-title mt-2">Nenhum pedido</p>
                  </td>
                </tr>
              ) : recentOrders.map((o) => (
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
                        background: statusStyle[o.status]?.bg || '#F4F7FE',
                        color: statusStyle[o.status]?.color || '#A3AED0'
                      }}
                    >
                      {statusConfig[o.status] || o.status}
                    </span>
                  </td>
                  <td style={{ color: '#A3AED0' }}>
                    {o.deliveryDate ? format(new Date(o.deliveryDate), 'dd/MM/yyyy') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
