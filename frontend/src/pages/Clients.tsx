import { useState, useEffect } from 'react';
import { clients as clientsApi } from '../lib/api';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

interface ClientsProps {
  user: any;
}

export default function Clients({ user }: ClientsProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', document: '', type: 'PF',
    street: '', number: '', neighborhood: '', city: '', state: '', zipCode: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    clientsApi.list()
      .then(res => { setClients(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientsApi.create(form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', document: '', type: 'PF', street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' });
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-slate-500">{clients.length} clientes cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(client => (
            <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {client.name[0].toUpperCase()}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.type === 'PJ' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {client.type}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">{client.name}</h3>
              <p className="text-slate-500 text-sm">{client.document || 'Sem documento'}</p>
              
              <div className="mt-4 space-y-2">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} /> {client.phone}
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} /> {client.city}{client.state ? `, ${client.state}` : ''}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <button className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Editar</button>
                <button className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold">Novo Cliente</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF/CNPJ</label>
                <input type="text" value={form.document} onChange={e => setForm({...form, document: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input type="text" value={form.street} onChange={e => setForm({...form, street: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Rua..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                  <input type="text" value={form.number} onChange={e => setForm({...form, number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                  <input type="text" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                  <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg" maxLength={2} />
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
