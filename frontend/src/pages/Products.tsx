import { useState, useEffect } from 'react';
import { products as productsApi } from '../lib/api';
import { Plus, Search, Package } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', type: 'WINDOW', basePrice: '' });

  useEffect(() => { loadProducts(); }, []);
  const loadProducts = () => { productsApi.list().then(res => { setProducts(res.data); setLoading(false); }).catch(() => setLoading(false)); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await productsApi.create({ ...form, basePrice: parseFloat(form.basePrice) }); setShowModal(false); loadProducts(); } catch (err) { console.error(err); }
  };
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const types: Record<string, string> = { WINDOW: 'Janela', DOOR: 'Porta', FACADE: 'Fachada', CUSTOM: 'Personalizado' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Produtos</h2><p className="text-slate-500">{products.length} tipologias</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /> Novo</button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl" />
      </div>
      {loading ? <div className="grid grid-cols-3 gap-4"><div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center"><Package className="text-blue-600" size={28} /></div>
                <div>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">{types[p.type] || p.type}</span>
                  <h3 className="font-semibold mt-2">{p.name}</h3>
                  <p className="text-slate-500 text-sm">{p.code}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-2xl font-bold">R$ {parseFloat(p.basePrice).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Novo Produto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Código" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="WINDOW">Janela</option><option value="DOOR">Porta</option><option value="FACADE">Fachada</option><option value="CUSTOM">Personalizado</option>
                </select>
              </div>
              <input type="text" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="number" placeholder="Preço Base" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
