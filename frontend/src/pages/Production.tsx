import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../lib/api';

interface ProductionOrder {
  id: string;
  budgetNumber: string;
  clientName: string;
  items: ProductionItem[];
  status: 'PENDING' | 'IN_PRODUCTION' | 'READY' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  createdAt: string;
}

interface ProductionItem {
  description: string;
  width: number;
  height: number;
  quantity: number;
  profileCuts: CutItem[];
  glassCuts: GlassCutItem[];
}

interface CutItem {
  profileName: string;
  length: number;
  quantity: number;
}

interface GlassCutItem {
  glassName: string;
  width: number;
  height: number;
  area: number;
  quantity: number;
}

export default function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Carregar pedidos com status de produção
      const ordersRes = await api.get('/orders');
      const ordersData = (ordersRes.data || []).filter((o: any) => 
        ['PENDING', 'APPROVED', 'IN_PRODUCTION', 'READY'].includes(o.status)
      );
      
      // Simular dados de PCP (em produção real, viria de uma tabela específica)
      const productionOrders: ProductionOrder[] = ordersData.map((o: any) => ({
        id: o.id,
        budgetNumber: o.number,
        clientName: o.client?.name || 'Cliente',
        items: o.items?.map((item: any) => ({
          description: item.description,
          width: item.width || 1200,
          height: item.height || 1200,
          quantity: item.quantity,
          profileCuts: [
            { profileName: 'Vertical Externo', length: item.height || 1200, quantity: item.quantity * 2 },
            { profileName: 'Trilho Inferior', length: item.width || 1200, quantity: item.quantity * 2 },
            { profileName: 'Intermediário', length: item.height || 1200, quantity: item.quantity },
          ],
          glassCuts: [
            { glassName: 'Vidro 4mm', width: (item.width || 1200) - 40, height: (item.height || 1200) - 60, area: 1.38, quantity: item.quantity }
          ]
        })) || [],
        status: mapToProductionStatus(o.status),
        priority: 'MEDIUM' as const,
        dueDate: o.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: o.createdAt
      }));
      
      setOrders(productionOrders);
    } catch (err) {
      console.error('Erro ao carregar ordens:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapToProductionStatus = (orderStatus: string): ProductionOrder['status'] => {
    switch (orderStatus) {
      case 'APPROVED': return 'PENDING';
      case 'IN_PRODUCTION': return 'IN_PRODUCTION';
      case 'READY': return 'READY';
      default: return 'PENDING';
    }
  };

  const updateStatus = async (orderId: string, newStatus: ProductionOrder['status']) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      loadOrders();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    IN_PRODUCTION: 'bg-blue-100 text-blue-700 border-blue-300',
    READY: 'bg-green-100 text-green-700 border-green-300',
    COMPLETED: 'bg-gray-100 text-gray-700 border-gray-300'
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HIGH: 'bg-red-100 text-red-700'
  };

  const generateCutReport = (order: ProductionOrder) => {
    const cuts: Record<string, { length: number; qty: number }> = {};
    
    order.items.forEach(item => {
      item.profileCuts.forEach(cut => {
        if (!cuts[cut.profileName]) {
          cuts[cut.profileName] = { length: cut.length, qty: 0 };
        }
        cuts[cut.profileName].qty += cut.quantity;
      });
    });
    
    return Object.entries(cuts).map(([name, data]) => ({
      profileName: name,
      ...data
    }));
  };

  const calculateBarsNeeded = (cuts: any[]) => {
    const BAR_LENGTH = 6000; // 6 metros
    let totalBars = 0;
    
    cuts.forEach(cut => {
      totalBars += Math.ceil((cut.length * cut.qty) / BAR_LENGTH);
    });
    
    return totalBars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏭 PCP - Controle de Produção</h1>
            <p className="text-gray-600 mt-1">Planejamento e controle de fabricação</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Ordens pendentes</p>
            <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'PENDING').length}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Aguardando', count: orders.filter(o => o.status === 'PENDING').length, color: 'bg-yellow-500' },
            { label: 'Em Produção', count: orders.filter(o => o.status === 'IN_PRODUCTION').length, color: 'bg-blue-500' },
            { label: 'Prontos', count: orders.filter(o => o.status === 'READY').length, color: 'bg-green-500' },
            { label: 'Total', count: orders.length, color: 'bg-gray-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className={`w-3 h-12 ${stat.color} rounded-full`}></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['ALL', 'PENDING', 'IN_PRODUCTION', 'READY', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'ALL' ? 'Todos' : 
               status === 'PENDING' ? 'Aguardando' :
               status === 'IN_PRODUCTION' ? 'Em Produção' :
               status === 'READY' ? 'Prontos' : 'Concluídos'}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className={`bg-white rounded-xl shadow-sm border-l-4 ${
                order.status === 'PENDING' ? 'border-yellow-500' :
                order.status === 'IN_PRODUCTION' ? 'border-blue-500' :
                order.status === 'READY' ? 'border-green-500' : 'border-gray-400'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{order.budgetNumber}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[order.priority]}`}>
                        {order.priority === 'HIGH' ? '🔴 Alta' : order.priority === 'MEDIUM' ? '🟡 Média' : '⚪ Baixa'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        {order.status === 'PENDING' ? '⏳ Aguardando' :
                         order.status === 'IN_PRODUCTION' ? '🔨 Em Produção' :
                         order.status === 'READY' ? '✅ Pronto' : '🏁 Concluído'}
                      </span>
                    </div>
                    <p className="text-gray-600">{order.clientName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.items.length} item(ns) • Entrega: {format(new Date(order.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(order.id, 'IN_PRODUCTION')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                      >
                        ▶ Iniciar Produção
                      </button>
                    )}
                    {order.status === 'IN_PRODUCTION' && (
                      <button
                        onClick={() => updateStatus(order.id, 'READY')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                      >
                        ✅ Marcar Pronto
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                    >
                      📋 Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Preview dos itens */}
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                      {item.description} ({item.quantity}x)
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-500">
                      +{order.items.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredOrders.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500">Nenhuma ordem de produção encontrada</p>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">📋 {selectedOrder.budgetNumber}</h2>
                  <p className="text-gray-600">{selectedOrder.clientName}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="font-semibold text-gray-900 mb-4">📦 Lista de Corte</h3>
                
                {generateCutReport(selectedOrder).map((cut, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                        📏
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cut.profileName}</p>
                        <p className="text-sm text-gray-500">{cut.length}mm × {cut.qty} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {Math.ceil((cut.length * cut.qty) / 6000)} barras
                      </p>
                      <p className="text-xs text-gray-500">
                        {(cut.length * cut.qty / 1000).toFixed(1)}m / {(Math.ceil((cut.length * cut.qty) / 6000) * 6).toFixed(1)}m disponível
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    📊 Total: {calculateBarsNeeded(generateCutReport(selectedOrder))} barras de 6m necessárias
                  </p>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-4 mt-6">🪟 Vidros</h3>
                {selectedOrder.items.flatMap(item => item.glassCuts).map((glass, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{glass.glassName}</p>
                      <p className="text-sm text-gray-500">{glass.width}x{glass.height}mm</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{glass.quantity} un</p>
                      <p className="text-xs text-gray-500">{(glass.area * glass.quantity).toFixed(2)}m²</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
