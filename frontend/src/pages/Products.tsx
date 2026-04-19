import { useState, useEffect } from 'react';
import { products as productsApi } from '../lib/api';
import { Plus, Search, Package } from 'lucide-react';

interface ProductsProps {
  user: any;
}

const productTypes = ['WINDOW', 'DOOR', 'FACADE', 'PORTAL', 'GLASS_PARTITION', 'CUSTOM'];
const typeLabels: Record<string, string> = {
  WINDOW: 'Janela', DOOR: 'Porta', FACADE: 'Fachada', PORTAL: 'Portal', GLASS_PARTITION: 'Divisória', CUSTOM: 'Personalizado'
};

export default function Products({ user }: ProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', description: '', type: 'WINDOW', basePrice: '' });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => {
    productsApi.list()
      .then(res => { setProducts(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productsApi.create({ ...form, basePrice: parseFloat(form.basePrice) });
      setShowModal(false);
      setForm({ code: '', name: '', description: '', type: 'WINDOW', basePrice: '' });
      loadProducts();
    } catch (err) { console.error(err); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Produtos</h2>
          <p className="text-slate-500">{products.length} tipologias cadastradas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => (
            <div key={product.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Package className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'DOOR' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {typeLabels[product.type] || product.type}
                  </span>
                  <h3 className="font-semibold text-slate-800 mt-2">{product.name}</h3>
                  <p className="text-slate-500 text-sm">{product.code}</p>
                </div>
              </div>
              {product.description && <p className="mt-4 text-slate-600 text-sm line-clamp-2">{product.description}</p>}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">R$ {parseFloat(product.basePrice).toLocaleString('pt-BR')}</span>
                <span className="text-slate-400 text-sm">/un</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold">Novo Produto</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="JAN-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    {productTypes.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Janela de Correr 1.20x1.50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base (R$) *</label>
                <input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="0.00" />
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
