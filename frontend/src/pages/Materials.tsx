import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Profile {
  id: string;
  code: string;
  name: string;
  category: string;
  weightPerMeter: string;
  pricePerKg: string;
  productLine?: { name: string };
}

interface Glass {
  id: string;
  code: string;
  name: string;
  type: string;
  thickness: string;
  pricePerM2: string;
  productLine?: { name: string };
}

interface Accessory {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: string;
  productLine?: { name: string };
}

interface ProductLineType {
  id: string;
  name: string;
  supplier: string;
}

type Tab = 'profiles' | 'glasses' | 'accessories' | 'product-lines';

export default function Materials() {
  const [tab, setTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [glasses, setGlasses] = useState<Glass[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [productLines, setProductLines] = useState<ProductLineType[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProductLine, setSelectedProductLine] = useState('');

  // Form state
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      const [profilesRes, glassesRes, accessoriesRes, linesRes] = await Promise.all([
        api.get('/profiles'),
        api.get('/glasses'),
        api.get('/accessories'),
        api.get('/product-lines')
      ]);
      setProfiles(profilesRes.data || []);
      setGlasses(glassesRes.data || []);
      setAccessories(accessoriesRes.data || []);
      setProductLines((linesRes.data || []) as ProductLineType[]);
      if (linesRes.data?.length > 0) {
        setSelectedProductLine(linesRes.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const saveItem = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'profiles' ? '/profiles' : 
                      tab === 'glasses' ? '/glasses' : 
                      tab === 'accessories' ? '/accessories' : '/product-lines';
      
      const data = {
        ...formData,
        productLineId: selectedProductLine || formData.productLineId
      };

      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, data);
      } else {
        await api.post(endpoint, data);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      const endpoint = tab === 'profiles' ? '/profiles' : 
                      tab === 'glasses' ? '/glasses' : 
                      tab === 'accessories' ? '/accessories' : '/product-lines';
      await api.delete(`${endpoint}/${id}`);
      loadData();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const categoryLabels: Record<string, string> = {
    TRACK_LOWER: 'Trilho Inferior',
    TRACK_UPPER: 'Trilho Superior',
    VERTICAL: 'Vertical',
    HORIZONTAL: 'Horizontal',
    INTERMEDIATE: 'Intermediário',
    LASTER: 'Lastro',
    FRAME: 'Batente',
    STILE: 'Montante',
    RAIL: 'Travessa',
    ROLLER: 'Roldana',
    LOCK: 'Fechadura',
    HINGE: 'Dobradiça',
    BRUSH: 'Escova',
    HANDLE: 'Puxador',
    CLOSER: 'Freio',
    SEAL: 'Vedação',
    SCREW: 'Parafuso',
    ANCHOR: 'Ancoragem',
    OTHER: 'Outro'
  };

  const glassTypeLabels: Record<string, string> = {
    FLOAT: 'Incolor',
    TEMPERED: 'Temperado',
    LAMINATED: 'Laminado',
    LOW_E: 'Low-E',
    REFLECTIVE: 'Refletivo',
    ACOUSTIC: 'Acústico'
  };

  const renderProfiles = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Código</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nome</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Categoria</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Peso (kg/m)</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Preço/kg</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {profiles.map(p => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-sm">{p.code}</td>
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-gray-600">{categoryLabels[p.category] || p.category}</td>
              <td className="px-4 py-3">{Number(p.weightPerMeter).toFixed(3)}</td>
              <td className="px-4 py-3">R$ {Number(p.pricePerKg).toFixed(2)}</td>
              <td className="px-4 py-3">
                <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Editar</button>
                <button onClick={() => deleteItem(p.id)} className="text-red-600 hover:text-red-800 text-sm">Excluir</button>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum perfil cadastrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderGlasses = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Código</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nome</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tipo</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Espessura</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Preço/m²</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {glasses.map(g => (
            <tr key={g.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-sm">{g.code}</td>
              <td className="px-4 py-3 font-medium">{g.name}</td>
              <td className="px-4 py-3 text-gray-600">{glassTypeLabels[g.type] || g.type}</td>
              <td className="px-4 py-3">{g.thickness}mm</td>
              <td className="px-4 py-3">R$ {Number(g.pricePerM2).toFixed(2)}</td>
              <td className="px-4 py-3">
                <button onClick={() => openEdit(g)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Editar</button>
                <button onClick={() => deleteItem(g.id)} className="text-red-600 hover:text-red-800 text-sm">Excluir</button>
              </td>
            </tr>
          ))}
          {glasses.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum vidro cadastrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderAccessories = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Código</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nome</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Categoria</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Unidade</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Preço Unit.</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {accessories.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-sm">{a.code}</td>
              <td className="px-4 py-3 font-medium">{a.name}</td>
              <td className="px-4 py-3 text-gray-600">{categoryLabels[a.category] || a.category}</td>
              <td className="px-4 py-3">{a.unit}</td>
              <td className="px-4 py-3">R$ {Number(a.pricePerUnit).toFixed(2)}</td>
              <td className="px-4 py-3">
                <button onClick={() => openEdit(a)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Editar</button>
                <button onClick={() => deleteItem(a.id)} className="text-red-600 hover:text-red-800 text-sm">Excluir</button>
              </td>
            </tr>
          ))}
          {accessories.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum acessório cadastrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderProductLines = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nome</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Fornecedor</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Perfis</th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {productLines.map((pl: ProductLineType) => {
            const profileCount = profiles.filter((p: Profile) => (p.productLine as any)?.id === pl.id).length;
            return (
              <tr key={pl.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{pl.name}</td>
                <td className="px-4 py-3 text-gray-600">{pl.supplier}</td>
                <td className="px-4 py-3">{profileCount}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(pl)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Editar</button>
                </td>
              </tr>
            );
          })}
          {productLines.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Nenhuma linha cadastrada</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Materiais</h1>
            <p className="text-gray-600 mt-1">Cadastro de perfis, vidros e acessórios</p>
          </div>
          <button
            onClick={openNew}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Novo Cadastro
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { id: 'profiles', label: '📦 Perfis', count: profiles.length },
            { id: 'glasses', label: '🪟 Vidros', count: glasses.length },
            { id: 'accessories', label: '🔧 Acessórios', count: accessories.length },
            { id: 'product-lines', label: '📋 Linhas', count: productLines.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                tab === t.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {tab === 'profiles' && renderProfiles()}
          {tab === 'glasses' && renderGlasses()}
          {tab === 'accessories' && renderAccessories()}
          {tab === 'product-lines' && renderProductLines()}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Editar' : 'Novo'} {tab === 'profiles' ? 'Perfil' : tab === 'glasses' ? 'Vidro' : tab === 'accessories' ? 'Acessório' : 'Linha'}
              </h2>

              {tab === 'product-lines' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      value={formData.supplier || ''}
                      onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Linha</label>
                      <select
                        value={selectedProductLine || formData.productLineId || ''}
                        onChange={e => setSelectedProductLine(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        {productLines.map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Selecione...</option>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  
                  {tab === 'profiles' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg/m)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.weightPerMeter || ''}
                          onChange={e => setFormData({ ...formData, weightPerMeter: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço/kg (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pricePerKg || ''}
                          onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {tab === 'glasses' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={formData.type || ''}
                          onChange={e => setFormData({ ...formData, type: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                          <option value="">Selecione...</option>
                          {Object.entries(glassTypeLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Espessura (mm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.thickness || ''}
                          onChange={e => setFormData({ ...formData, thickness: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço/m² (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pricePerM2 || ''}
                          onChange={e => setFormData({ ...formData, pricePerM2: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {tab === 'accessories' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                        <select
                          value={formData.unit || 'un'}
                          onChange={e => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                          <option value="un">Unidade</option>
                          <option value="m">Metro</option>
                          <option value="kg">Kg</option>
                          <option value="l">Litro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit. (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pricePerUnit || ''}
                          onChange={e => setFormData({ ...formData, pricePerUnit: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveItem}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
