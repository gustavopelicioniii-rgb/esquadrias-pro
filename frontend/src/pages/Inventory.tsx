import { useState, useEffect } from 'react';
import { materials } from '../lib/api';
import { Plus, Search, Box, AlertTriangle, TrendingUp } from 'lucide-react';

interface InventoryProps { user: any; }

const categoryConfig: Record<string, { label: string; color: string }> = {
  PROFILE: { label: 'Perfil', color: 'bg-blue-100 text-blue-600' },
  GLASS: { label: 'Vidro', color: 'bg-cyan-100 text-cyan-600' },
  ACCESSORY: { label: 'Acessório', color: 'bg-amber-100 text-amber-600' },
  TOOL: { label: 'Ferramenta', color: 'bg-purple-100 text-purple-600' },
  EQUIPMENT: { label: 'Equipamento', color: 'bg-slate-100 text-slate-600' },
  CONSUMABLE: { label: 'Consumível', color: 'bg-orange-100 text-orange-600' },
  OTHER: { label: 'Outro', color: 'bg-gray-100 text-gray-600' },
};

export default function Inventory({ user }: InventoryProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', category: 'PROFILE', quantity: '', unit: 'un', minQuantity: '', maxQuantity: '', location: '', costPrice: '', salePrice: '' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = () => {
    materials.inventory.list()
      .then(res => { setItems(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materials.inventory.create({
        ...form,
        quantity: parseFloat(form.quantity) || 0,
        minQuantity: form.minQuantity ? parseFloat(form.minQuantity) : null,
        maxQuantity: form.maxQuantity ? parseFloat(form.maxQuantity) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
      });
      setShowModal(false);
      setForm({ code: '', name: '', category: 'PROFILE', quantity: '', unit: 'un', minQuantity: '', maxQuantity: '', location: '', costPrice: '', salePrice: '' });
      loadItems();
    } catch (err) { console.error(err); }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()));

  const lowStock = items.filter(i => i.minQuantity && Number(i.quantity) < Number(i.minQuantity)).length;
  const totalValue = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.costPrice || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estoque</h2>
          <p className="text-slate-500">{items.length} itens cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Novo Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Box className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Total de Itens</p>
              <p className="text-2xl font-bold text-slate-800">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Estoque Baixo</p>
              <p className="text-2xl font-bold text-red-600">{lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Valor Total</p>
              <p className="text-2xl font-bold text-slate-800">R$ {totalValue.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => {
            const isLow = item.minQuantity && Number(item.quantity) < Number(item.minQuantity);
            const cat = categoryConfig[item.category] || categoryConfig.OTHER;
            return (
              <div key={item.id} className={`bg-white rounded-xl p-6 shadow-sm border ${isLow ? 'border-red-200' : 'border-slate-100'} hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Box className="text-slate-600" size={24} />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color}`}>{cat.label}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                <p className="text-slate-500 text-sm">{item.code}</p>
                {item.location && <p className="text-slate-400 text-xs mt-1">📍 {item.location}</p>}
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">Quantidade</span>
                    <span className={`font-bold text-lg ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  {isLow && (
                    <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
                      <AlertTriangle size={12} /> Abaixo do mínimo ({item.minQuantity})
                    </div>
                  )}
                  {item.costPrice && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-500 text-sm">Custo</span>
                      <span className="text-slate-600">R$ {Number(item.costPrice).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold">Novo Item de Estoque</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="PFL-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="un">Un</option>
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="bar">Barra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Prateleira A-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mín.</label>
                  <input type="number" step="0.001" value={form.minQuantity} onChange={e => setForm({...form, minQuantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Máx.</label>
                  <input type="number" step="0.001" value={form.maxQuantity} onChange={e => setForm({...form, maxQuantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço Custo</label>
                  <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda</label>
                  <input type="number" step="0.01" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})}
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
