import { useState, useEffect } from 'react';
import { dashboard } from '../lib/api';
import { TrendingUp, Users, FileText, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Clientes', value: data?.clients || 0, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { label: 'Orçamentos', value: data?.budgets?.total || 0, icon: FileText, color: 'bg-purple-500', trend: '+8%' },
    { label: 'Pedidos', value: data?.orders?.total || 0, icon: ShoppingCart, color: 'bg-amber-500', trend: '+23%' },
    { label: 'Faturamento', value: `R$ ${(data?.financial?.income || 0).toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-green-500', trend: '+18%' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta, {user?.user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-blue-100">Aqui está o resumo da sua empresa hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <ArrowUpRight size={16} />
                  {stat.trend}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mt-4">{stat.value}</p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumo Financeiro</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Receitas</p>
                <p className="text-xl font-bold text-green-600">R$ {data?.financial?.income?.toLocaleString('pt-BR') || '0'}</p>
              </div>
              <TrendingUp className="text-green-500" size={28} />
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Despesas</p>
                <p className="text-xl font-bold text-red-600">R$ {data?.financial?.expenses?.toLocaleString('pt-BR') || '0'}</p>
              </div>
              <TrendingUp className="text-red-500 rotate-180" size={28} />
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Lucro</p>
                <p className="text-xl font-bold text-blue-600">R$ {data?.financial?.profit?.toLocaleString('pt-BR') || '0'}</p>
              </div>
              <DollarSign className="text-blue-500" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">A Receber</h3>
          <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-800">R$ {data?.financial?.pendingReceivable?.toLocaleString('pt-BR') || '0'}</p>
              <p className="text-slate-500 text-sm mt-2">Valores a receber de clientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Orçamentos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold">{data?.budgets?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Aprovados</span>
              <span className="font-semibold text-green-600">{data?.budgets?.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Valor Total</span>
              <span className="font-semibold">R$ {data?.budgets?.value?.toLocaleString('pt-BR') || '0'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Pedidos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold">{data?.orders?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Valor Total</span>
              <span className="font-semibold">R$ {data?.orders?.value?.toLocaleString('pt-BR') || '0'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Meta do Mês</h3>
          <div className="text-center py-6">
            <p className="text-5xl font-bold mb-2">R$ 50k</p>
            <div className="w-full bg-white/20 rounded-full h-3 mt-4">
              <div className="bg-white rounded-full h-3 w-3/4"></div>
            </div>
            <p className="text-sm mt-2 text-blue-100">75% da meta atingida</p>
          </div>
        </div>
      </div>
    </div>
  );
}
