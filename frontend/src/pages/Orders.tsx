import { useState, useEffect } from 'react';
import { orders as ordersApi, clients as clientsApi, budgets as budgetsApi } from '../lib/api';
import { Plus, Search, ShoppingCart, Clock, CheckCircle, Truck } from 'lucide-react';

interface OrdersProps { user: any; }

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: 'bg-slate-100 text-slate-600', icon: Clock },
  APPROVED: { label: 'Aprovado', color: 'bg-blue-100 text-blue-600', icon: CheckCircle },
  IN_PRODUCTION: { label: 'Em Produção', color: 'bg-amber-100 text-amber-600', icon: Truck },
  READY: { label: 'Pronto', color: 'bg-purple-100 text-purple-600', icon: CheckCircle },
  INSTALLED: { label: 'Instalado', color: 'bg-green-100 text-green-600', icon: CheckCircle },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-600', icon: Clock },
};

export default function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ clientId: '', budgetId: '', totalValue: 0, deliveryDate: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    Promise.all([ordersApi.list(), clientsApi.list(), budgetsApi.list()])
      .then(([o, c, b]) => { setOrders(o.data); setClients(c.data); setBudgets(b.data.filter((x: any) => x.status === 'APPROVED')); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ordersApi.create(form);
      setShowModal(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] });
  const updateItem = (i: number, field: string, value: any) => {
    const items = [...form.items]; items[i] = { ...items[i], [field]: value }; setForm({ ...form, items });
  };

  const total = form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const filtered = orders.filter(o => o.number?.toLowerCase().includes(search.toLowerCase()) || o.client?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pedidos</h2>
          <p className="text-slate-500">{orders.length} pedidos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Novo Pedido
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar pedido..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>)}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            return (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <ShoppingCart className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{order.number}</h3>
                      <p className="text-slate-500 text-sm">{order.client?.name || 'Sem cliente'} • {new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">R$ {parseFloat(order.totalValue).toLocaleString('pt-BR')}</p>
                      {order.deliveryDate && <p className="text-slate-500 text-sm">Entrega: {new Date(order.deliveryDate).toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                      <StatusIcon size={14} className="inline mr-1" /> {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold">Novo Pedido</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option value="">Selecione</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orçamento (opcional)</label>
                <select value={form.budgetId} onChange={e => setForm({...form, budgetId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option value="">Nenhum</option>
                  {budgets.map(b => <option key={b.id} value={b.id}>{b.number} - {b.client?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Entrega</label>
                <input type="date" value={form.deliveryDate} onChange={e => setForm({...form, deliveryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Itens</label>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <input type="text" placeholder="Descrição" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg" required />
                      <input type="number" placeholder="Qtd" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg" />
                      <input type="number" step="0.01" placeholder="Preço" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ Adicionar item</button>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
