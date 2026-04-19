import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../lib/api';

interface BudgetItem {
  id?: string;
  typologyId: string;
  typologyName: string;
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Budget {
  id: string;
  number: string;
  status: string;
  client?: { name: string };
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  createdAt: string;
  notes?: string;
  items?: any[];
}

interface Client {
  id: string;
  name: string;
}

interface CalculationResult {
  totals: { salePrice: number };
  profiles: any[];
  glasses: any[];
  accessories: any[];
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [typologies, setTypologies] = useState<any[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Editor state
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [notes, setNotes] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [budgetsRes, clientsRes, typesRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/clients'),
        api.get('/calculate/typologies')
      ]);
      setBudgets(budgetsRes.data || []);
      setClients(clientsRes.data || []);
      setTypologies(typesRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const openNewBudget = () => {
    setEditingBudget(null);
    setSelectedClient('');
    setItems([]);
    setNotes('');
    setValidityDays(30);
    setDiscount(0);
    setShowEditor(true);
  };

  const openEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setSelectedClient('');
    setNotes(budget.notes || '');
    setDiscount(budget.discount || 0);
    // Load budget items
    setShowEditor(true);
  };

  const addItem = async (typologyId: string, width: number, height: number, quantity: number) => {
    try {
      const typesRes = await api.get('/calculate/typologies');
      const typology = typesRes.data.find((t: any) => t.id === typologyId);
      if (!typology) return;

      const linesRes = await api.get('/calculate/product-lines');
      const productLine = linesRes.data[0];
      if (!productLine) return;

      const calcRes = await api.post('/calculate/calculate', {
        typologyId,
        productLineId: productLine.id,
        width,
        height,
        quantity
      });

      const calc = calcRes.data as CalculationResult;

      const newItem: BudgetItem = {
        id: crypto.randomUUID(),
        typologyId,
        typologyName: typology.name,
        width,
        height,
        quantity,
        unitPrice: calc.totals.salePrice / quantity,
        totalPrice: calc.totals.salePrice
      };

      setItems([...items, newItem]);
    } catch (err) {
      console.error('Erro ao calcular item:', err);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItemQty = (id: string, quantity: number) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const newTotal = i.unitPrice * quantity;
        return { ...i, quantity, totalPrice: newTotal };
      }
      return i;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const total = subtotal - discount;

  const saveBudget = async () => {
    setLoading(true);
    try {
      const data = {
        clientId: selectedClient || null,
        items: items.map(i => ({
          description: `${i.typologyName} ${i.width}x${i.height}`,
          quantity: i.quantity,
          width: i.width,
          height: i.height,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice
        })),
        notes,
        validityDays,
        discount
      };

      if (editingBudget) {
        // Update existing
        // await api.put(`/budgets/${editingBudget.id}`, data);
      } else {
        // Create new
        await api.post('/budgets', data);
      }

      setShowEditor(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-yellow-100 text-yellow-700',
    CONVERTED: 'bg-purple-100 text-purple-700'
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    EXPIRED: 'Expirado',
    CONVERTED: 'Convertido'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-gray-600 mt-1">Gerencie seus orçamentos e propostas</p>
          </div>
          <button
            onClick={openNewBudget}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span> Novo Orçamento
          </button>
        </div>

        {/* Lista de Orçamentos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Número</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Valor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Validade</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum orçamento encontrado
                  </td>
                </tr>
              ) : budgets.map(budget => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{budget.number}</td>
                  <td className="px-6 py-4 text-gray-700">{budget.client?.name || 'Sem cliente'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[budget.status] || 'bg-gray-100'}`}>
                      {statusLabels[budget.status] || budget.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    R$ {Number(budget.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {budget.validUntil ? format(new Date(budget.validUntil), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditBudget(budget)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Editor de Orçamento */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBudget ? `Editar ${editingBudget.number}` : 'Novo Orçamento'}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Esquerda: Formulário */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Cliente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                      <select
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Adicionar Item */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Adicionar Esquadria</h3>
                      <div className="space-y-3">
                        <select
                          id="newTypology"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          {typologies.map(t => (
                            <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            id="newWidth"
                            placeholder="Largura (mm)"
                            defaultValue={1200}
                            className="p-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            id="newHeight"
                            placeholder="Altura (mm)"
                            defaultValue={1200}
                            className="p-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <input
                          type="number"
                          id="newQty"
                          placeholder="Quantidade"
                          defaultValue={1}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            const typologyId = (document.getElementById('newTypology') as HTMLSelectElement).value;
                            const width = Number((document.getElementById('newWidth') as HTMLInputElement).value);
                            const height = Number((document.getElementById('newHeight') as HTMLInputElement).value);
                            const qty = Number((document.getElementById('newQty') as HTMLInputElement).value);
                            if (typologyId && width && height && qty) {
                              addItem(typologyId, width, height, qty);
                            }
                          }}
                          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Validade (dias)</label>
                      <input
                        type="number"
                        value={validityDays}
                        onChange={e => setValidityDays(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        min={1}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desconto (R$)</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={e => setDiscount(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        min={0}
                        step={0.01}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg h-24"
                        placeholder="Notas adicionais..."
                      />
                    </div>
                  </div>

                  {/* Direita: Itens do Orçamento */}
                  <div className="lg:col-span-2">
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b font-semibold text-gray-900">
                        Itens do Orçamento ({items.length})
                      </div>
                      
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          Nenhum item adicionado
                        </div>
                      ) : (
                        <div className="divide-y max-h-96 overflow-y-auto">
                          {items.map(item => (
                            <div key={item.id} className="p-4 flex items-center gap-4">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.typologyName}</div>
                                <div className="text-sm text-gray-500">{item.width}x{item.height}mm</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQty(item.id!, Math.max(1, item.quantity - 1))}
                                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateItemQty(item.id!, item.quantity + 1)}
                                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-right w-32">
                                <div className="font-semibold">R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                <div className="text-xs text-gray-500">R$ {item.unitPrice.toLocaleString('pt-BR')} un</div>
                              </div>
                              <button
                                onClick={() => removeItem(item.id!)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Totais */}
                      <div className="p-4 bg-gray-50 border-t space-y-2">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto</span>
                            <span>- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                          <span>Total</span>
                          <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBudget}
                  disabled={loading || items.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {loading ? 'Salvando...' : 'Salvar Orçamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
