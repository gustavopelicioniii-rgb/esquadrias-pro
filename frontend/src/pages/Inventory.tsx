import { useState, useEffect } from 'react';
import { materials } from '../lib/api';
import { Box, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { materials.inventory.list().then(res => { setItems(res.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const lowStock = items.filter(i => i.minQuantity && Number(i.quantity) < Number(i.minQuantity)).length;
  const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.costPrice || 0), 0);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Estoque</h2><p className="text-slate-500">{items.length} itens</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm"><Box className="text-blue-600 mb-2" size={32} /><p className="text-2xl font-bold">{items.length}</p><p className="text-slate-500">Total Itens</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm"><AlertTriangle className="text-red-600 mb-2" size={32} /><p className="text-2xl font-bold text-red-600">{lowStock}</p><p className="text-slate-500">Estoque Baixo</p></div>
        <div className="bg-white rounded-xl p-6 shadow-sm"><p className="text-2xl font-bold">R$ {totalValue.toLocaleString('pt-BR')}</p><p className="text-slate-500">Valor Total</p></div>
      </div>
      {loading ? <div className="grid grid-cols-3 gap-4"><div className="h-32 bg-slate-100 rounded-xl animate-pulse"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-slate-500 text-sm">{item.code}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                <span className="text-lg font-bold">{item.quantity} {item.unit}</span>
                {item.minQuantity && Number(item.quantity) < Number(item.minQuantity) && <span className="text-red-600 text-sm">⚠️ Baixo</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
