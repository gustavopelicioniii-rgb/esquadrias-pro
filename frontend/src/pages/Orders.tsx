import { useState, useEffect } from 'react';
import { orders as ordersApi } from '../lib/api';
import { Plus, ShoppingCart } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ordersApi.list().then(res => { setOrders(res.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800">Pedidos</h2><p className="text-slate-500">{orders.length} pedidos</p></div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /> Novo</button>
      </div>
      {loading ? <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div> : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><ShoppingCart className="text-amber-600" size={24} /></div>
                <div><h3 className="font-semibold">{o.number}</h3><p className="text-slate-500 text-sm">{o.client?.name}</p></div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">R$ {parseFloat(o.totalValue).toLocaleString('pt-BR')}</p>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-600">{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
