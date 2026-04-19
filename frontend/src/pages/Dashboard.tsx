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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Clientes',
      value: data.clients,
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Orçamentos',
      value: data.budgets.total,
      sublabel: `${data.budgets.approved} aprovados`,
      icon: '📋',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      value2: `R$ ${(data.budgets.value / 1000).toFixed(1)}k`
    },
    {
      label: 'Pedidos',
      value: data.orders.total,
      icon: '📦',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      value2: `R$ ${(data.orders.value / 1000).toFixed(1)}k`
    },
    {
      label: 'Faturamento',
      value: `R$ ${(data.financial.income / 1000).toFixed(1)}k`,
      icon: '💰',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    IN_PRODUCTION: 'bg-orange-100 text-orange-700',
    READY: 'bg-teal-100 text-teal-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Olá! Bem-vindo ao EsquadriAPI • {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, i) => (
            <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                  {card.sublabel && (
                    <p className="text-white/70 text-sm mt-1">{card.sublabel}</p>
                  )}
                  {card.value2 && (
                    <p className="text-white/90 text-lg font-semibold mt-1">{card.value2}</p>
                  )}
                </div>
                <div className="text-4xl">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* financeiro */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💳</span> Resumo Financeiro
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-600 font-medium">Receitas</p>
                  <p className="text-xl font-bold text-green-700">
                    R$ {data.financial.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-red-600 font-medium">Despesas</p>
                  <p className="text-xl font-bold text-red-700">
                    R$ {data.financial.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-2xl">📉</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Lucro</p>
                  <p className="text-2xl font-bold text-blue-700">
                    R$ {data.financial.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-3xl">💵</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">A Receber</p>
                  <p className="text-lg font-bold text-yellow-700">
                    R$ {data.financial.pendingReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          {/* Orçamentos Recentes */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>📋</span> Últimos Orçamentos
              </h2>
              <span className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">Ver todos →</span>
            </div>
            <div className="divide-y">
              {recentBudgets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Nenhum orçamento ainda</p>
                </div>
              ) : recentBudgets.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                      📄
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{b.number}</p>
                      <p className="text-sm text-gray-500">{b.client?.name || 'Sem cliente'} • {format(new Date(b.createdAt), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">R$ {Number(b.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pedidos Recentes */}
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🚚</span> Pedidos em Andamento
            </h2>
            <span className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">Ver todos →</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Número</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📦</div>
                      <p>Nenhum pedido ainda</p>
                    </td>
                  </tr>
                ) : recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{o.number}</td>
                    <td className="px-6 py-4 text-gray-700">{o.client?.name || 'Sem cliente'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      R$ {Number(o.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[o.status] || 'bg-gray-100'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {o.deliveryDate ? format(new Date(o.deliveryDate), 'dd/MM/yyyy') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-center group">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform">
              🧮
            </div>
            <p className="font-medium text-gray-900">Calculadora</p>
            <p className="text-xs text-gray-500">Calcular custo</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-center group">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform">
              📋
            </div>
            <p className="font-medium text-gray-900">Orçamento</p>
            <p className="text-xs text-gray-500">Novo orçamento</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-center group">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform">
              👤
            </div>
            <p className="font-medium text-gray-900">Cliente</p>
            <p className="text-xs text-gray-500">Novo cliente</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-center group">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 group-hover:scale-110 transition-transform">
              📦
            </div>
            <p className="font-medium text-gray-900">Pedido</p>
            <p className="text-xs text-gray-500">Novo pedido</p>
          </button>
        </div>
      </div>
    </div>
  );
}
