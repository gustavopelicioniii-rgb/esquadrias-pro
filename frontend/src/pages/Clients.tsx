import { useState, useEffect } from 'react';
import { clients as clientsApi } from '../lib/api';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '', type: 'PF' });

  useEffect(() => { loadClients(); }, []);
  const loadClients = () => {
    clientsApi.list().then(res => { setClients(res.data); setLoading(false); }).catch(() => setLoading(false));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await clientsApi.create(form); setShowModal(false); setForm({ name: '', email: '', phone: '', document: '', type: 'PF' }); loadClients(); } catch (err) { console.error(err); }
  };
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Clientes</h2><p className="text-slate-500">{clients.length} clientes</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /> Novo</button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl" />
      </div>
      {loading ? <div className="grid grid-cols-3 gap-4"><div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(client => (
            <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">{client.name[0].toUpperCase()}</div>
                <div><h3 className="font-semibold">{client.name}</h3><span className="text-xs text-slate-400">{client.type}</span></div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {client.email && <div className="flex items-center gap-2"><Mail size={14} /> {client.email}</div>}
                {client.phone && <div className="flex items-center gap-2"><Phone size={14} /> {client.phone}</div>}
                {client.city && <div className="flex items-center gap-2"><MapPin size={14} /> {client.city}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Novo Cliente</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                <input type="text" placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
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
