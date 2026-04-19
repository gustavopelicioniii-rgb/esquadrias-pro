import { useState, useEffect } from 'react';
import { transactions as transactionsApi } from '../lib/api';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FinancialProps { user: any; }

const typeConfig: Record<string, { label: string; color: string }> = {
  INCOME: { label: 'Receita', color: 'text-green-600' },
  EXPENSE: { label: 'Despesa', color: 'text-red-600' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-slate-100 text-slate-600' },
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-600' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-100 text-red-600' },
  PARTIAL: { label: 'Parcial', color: 'bg-amber-100 text-amber-600' },
};

export default function Financial({ user }: FinancialProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [form, setForm] = useState({ type: 'INCOME', category: 'SALE', description: '', amount: '', dueDate: '', clientId: '' });

  useEffect(() => { loadTransactions(); }, []);

  const loadTransactions = () => {
    transactionsApi.list()
      .then(res => { setTransactions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsApi.create({ ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
      setForm({ type: 'INCOME', category: 'SALE', description: '', amount: '', dueDate: '', clientId: '' });
      loadTransactions();
    } catch (err) { console.error(err); }
  };

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter.toUpperCase());
  const income = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
  const pending = transactions.filter(t => t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0);
  const overdue = transactions.filter(t => t.status === 'OVERDUE').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-slate-500">{transactions.length} transações</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Nova Transação
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Receitas</p>
              <p className="text-3xl font-bold mt-1">R$ {income.toLocaleString('pt-BR')}</p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Despesas</p>
              <p className="text-3xl font-bold mt-1">R$ {expenses.toLocaleString('pt-BR')}</p>
            </div>
            <TrendingDown size={32} className="text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">A Receber/Pagar</p>
              <p className="text-3xl font-bold mt-1">R$ {pending.toLocaleString('pt-BR')}</p>
            </div>
            <DollarSign size={32} className="text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Vencidos</p>
              <p className="text-3xl font-bold mt-1">R$ {overdue.toLocaleString('pt-BR')}</p>
            </div>
            <ArrowDownRight size={32} className="text-red-200" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>)}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Descrição</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Categoria</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Vencimento</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-600">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${t.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-slate-800">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{t.category}</td>
                  <td className="px-6 py-4 text-slate-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[t.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {statusConfig[t.status]?.label || t.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${typeConfig[t.type]?.color || 'text-slate-800'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold">Nova Transação</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="SALE">Venda</option>
                    <option value="SERVICE">Serviço</option>
                    <option value="INSTALLATION">Instalação</option>
                    <option value="MATERIAL">Material</option>
                    <option value="LABOR">Mão de Obra</option>
                    <option value="RENT">Aluguel</option>
                    <option value="UTILITY">Utilidades</option>
                    <option value="SALARY">Salário</option>
                    <option value="TAX">Imposto</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
