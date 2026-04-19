import { useState, useEffect } from 'react';
import { transactions as transactionsApi } from '../lib/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Financial() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'INCOME', category: 'SALE', description: '', amount: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = () => { transactionsApi.list().then(res => { setTransactions(res.data); setLoading(false); }).catch(() => setLoading(false)); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await transactionsApi.create({ ...form, amount: parseFloat(form.amount) }); setShowModal(false); setForm({ type: 'INCOME', category: 'SALE', description: '', amount: '' }); loadData(); } catch (err) { console.error(err); }
  };
  const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Financeiro</h2><p className="text-slate-500">{transactions.length} transações</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">+ Nova</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white"><TrendingUp size={32} className="mb-2" /><p className="text-green-100 text-sm">Receitas</p><p className="text-3xl font-bold">R$ {income.toLocaleString('pt-BR')}</p></div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-6 text-white"><TrendingDown size={32} className="mb-2" /><p className="text-red-100 text-sm">Despesas</p><p className="text-3xl font-bold">R$ {expenses.toLocaleString('pt-BR')}</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white"><DollarSign size={32} className="mb-2" /><p className="text-blue-100 text-sm">Lucro</p><p className="text-3xl font-bold">R$ {(income - expenses).toLocaleString('pt-BR')}</p></div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Nova Transação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="px-3 py-2 border rounded-lg"><option value="INCOME">Receita</option><option value="EXPENSE">Despesa</option></select>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 border rounded-lg"><option value="SALE">Venda</option><option value="SERVICE">Serviço</option><option value="MATERIAL">Material</option><option value="OTHER">Outro</option></select>
              </div>
              <input type="text" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="number" placeholder="Valor" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
