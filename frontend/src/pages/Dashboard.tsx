import { useState, useEffect } from 'react';
import { dashboard } from '../lib/api';
import { TrendingUp, Users, FileText, ShoppingCart, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get()
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse"><div className="h-32 bg-slate-200 rounded-xl"></div></div>;
  }

  const stats = [
    { label: 'Clientes', value: data?.clients || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Orçamentos', value: data?.budgets?.total || 0, icon: FileText, color: 'bg-purple-500' },
    { label: 'Pedidos', value: data?.orders?.total || 0, icon: ShoppingCart, color: 'bg-amber-500' },
    { label: 'Faturamento', value: `R$ ${(data?.financial?.income || 0).toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Bem-vindo! 👋</h2>
        <p className="text-blue-100">Resumo da sua empresa</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className={`${stat.color} p-3 rounded-xl inline-block`}>
                <Icon size={24} className="text-white" />
              </div>
              <p className="text-3xl font-bold text-slate-800 mt-4">{stat.value}</p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Financeiro</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
              <span>Receitas</span>
              <span className="font-bold text-green-600">R$ {data?.financial?.income?.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
              <span>Despesas</span>
              <span className="font-bold text-red-600">R$ {data?.financial?.expenses?.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
              <span>Lucro</span>
              <span className="font-bold text-blue-600">R$ {data?.financial?.profit?.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">A Receber</h3>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-slate-800">R$ {data?.financial?.pendingReceivable?.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
