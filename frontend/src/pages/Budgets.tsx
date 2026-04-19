import { useState, useEffect } from 'react';
import { budgets as budgetsApi, clients as clientsApi } from '../lib/api';
import { Plus, Search, FileText } from 'lucide-react';

export default function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });

  useEffect(() => { loadData(); }, []);
  const loadData = () => { Promise.all([budgetsApi.list(), clientsApi.list()]).then(([b, c]) => { setBudgets(b.data); setClients(c.data); setLoading(false); }).catch(() => setLoading(false)); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await budgetsApi.create(form); setShowModal(false); setForm({ clientId: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] }); loadData(); } catch (err) { console.error(err); }
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] });
  const total = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Orçamentos</h2><p className="text-slate-500">{budgets.length} orçamentos</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /> Novo</button>
      </div>
      {loading ? <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div> : (
        <div className="space-y-4">
          {budgets.map(b => (
            <div key={b.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="text-blue-600" size={24} /></div>
                <div><h3 className="font-semibold">{b.number}</h3><p className="text-slate-500 text-sm">{b.client?.name || 'Sem cliente'}</p></div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">R$ {parseFloat(b.total).toLocaleString('pt-BR')}</p>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Novo Orçamento - R$ {total.toLocaleString('pt-BR')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Selecione</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <input type="text" placeholder="Descrição" value={item.description} onChange={e => { const items = [...form.items]; items[i] = {...items[i], description: e.target.value}; setForm({...form, items}); }} className="flex-1 px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Qtd" value={item.quantity} onChange={e => { const items = [...form.items]; items[i] = {...items[i], quantity: parseInt(e.target.value)}; setForm({...form, items}); }} className="w-20 px-3 py-2 border rounded-lg" />
                  <input type="number" placeholder="Preço" value={item.unitPrice} onChange={e => { const items = [...form.items]; items[i] = {...items[i], unitPrice: parseFloat(e.target.value)}; setForm({...form, items}); }} className="w-32 px-3 py-2 border rounded-lg" />
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Adicionar item</button>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
