import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../lib/api';

interface Budget {
  id: string;
  number: string;
  status: string;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  notes: string;
  createdAt: string;
  client?: {
    name: string;
    email?: string;
    phone?: string;
  };
  organization?: {
    name: string;
  };
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (token) {
      loadBudget();
    }
  }, [token]);

  const loadBudget = async () => {
    try {
      const res = await api.get(`/public/budget/${token}`);
      setBudget(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Orçamento não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!budget) return;
    try {
      await api.post(`/public/budget/${token}/accept`);
      setAccepted(true);
      loadBudget();
    } catch (err) {
      alert('Erro ao aceitar orçamento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!budget) return null;

  const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
    DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Rascunho', icon: '📝' },
    SENT: { color: 'bg-blue-100 text-blue-700', label: 'Enviado', icon: '📤' },
    APPROVED: { color: 'bg-green-100 text-green-700', label: 'Aprovado', icon: '✅' },
    REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejeitado', icon: '❌' },
    EXPIRED: { color: 'bg-yellow-100 text-yellow-700', label: 'Expirado', icon: '⏰' },
    CONVERTED: { color: 'bg-purple-100 text-purple-700', label: 'Convertido em Pedido', icon: '📦' }
  };

  const status = statusConfig[budget.status] || statusConfig.DRAFT;
  const isExpired = new Date(budget.validUntil) < new Date();
  const canAccept = budget.status === 'SENT' && !isExpired && !accepted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{budget.organization?.name || 'EsquadriAPI'}</h1>
              <p className="text-white/70">Orçamento #{budget.number}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Validade */}
        {isExpired && budget.status === 'SENT' && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 mb-6 text-center">
            <p className="text-yellow-200 font-medium">
              ⚠️ Este orçamento expirou em {format(new Date(budget.validUntil), 'dd/MM/yyyy')}
            </p>
          </div>
        )}

        {/* Client Info */}
        {budget.client && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium text-gray-900">{budget.client.name}</p>
              </div>
              {budget.client.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{budget.client.email}</p>
                </div>
              )}
              {budget.client.phone && (
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium text-gray-900">{budget.client.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Itens do Orçamento</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Descrição</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Qtd</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Valor Unit.</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(budget.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    {item.width && item.height && (
                      <p className="text-sm text-gray-500">{item.width}x{item.height}mm</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">
                    R$ {Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    R$ {Number(item.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="px-6 py-4 bg-gray-50 border-t space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {Number(budget.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(budget.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto</span>
                <span>- R$ {Number(budget.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>R$ {Number(budget.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {budget.notes && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{budget.notes}</p>
          </div>
        )}

        {/* Validity */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <p className="text-sm text-gray-500">Validade do orçamento</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(budget.validUntil), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canAccept && !accepted && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Gostou do orçamento?</h3>
            <p className="text-white/80 mb-4">Clique abaixo para aprovar e dar início à produção</p>
            <button
              onClick={handleAccept}
              className="px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-xl hover:bg-green-50 transition-colors"
            >
              ✅ Aprovar Orçamento
            </button>
          </div>
        )}

        {accepted && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Orçamento Aprovado!</h3>
            <p className="text-white/80">Entraremos em contato em breve para dar continuidade.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-white/50 text-sm">
          <p>Gerado por EsquadriAPI • {format(new Date(budget.createdAt), 'dd/MM/yyyy')}</p>
        </footer>
      </main>
    </div>
  );
}
