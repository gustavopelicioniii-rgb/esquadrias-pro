import { useState, useEffect } from 'react';
import api from '../lib/api';

const TYPOLOGIES = [
  { id: 'JC-2F', name: 'Janela Correr 2 Folhas', icon: '🪟' },
  { id: 'JC-4F', name: 'Janela Correr 4 Folhas', icon: '🪟' },
  { id: 'PG-1F', name: 'Porta de Giro 1 Folha', icon: '🚪' },
  { id: 'PG-2F', name: 'Porta de Giro 2 Folhas', icon: '🚪' },
];

export default function Calculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [typologies, setTypologies] = useState<any[]>([]);
  const [productLines, setProductLines] = useState<any[]>([]);
  
  const [selectedTypology, setSelectedTypology] = useState('');
  const [selectedProductLine, setSelectedProductLine] = useState('');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1200);
  const [quantity, setQuantity] = useState(1);
  const [glassType, setGlassType] = useState('FLOAT');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [typesRes, linesRes] = await Promise.all([
        api.get('/calculate/typologies'),
        api.get('/calculate/product-lines')
      ]);
      const types = typesRes.data || [];
      const lines = linesRes.data || [];
      setTypologies(types);
      setProductLines(lines);
      if (types.length > 0) setSelectedTypology(types[0].id);
      if (lines.length > 0) setSelectedProductLine(lines[0].id);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleCalculate = async () => {
    if (!selectedTypology || !selectedProductLine) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/calculate/calculate', {
        typologyId: selectedTypology,
        productLineId: selectedProductLine,
        width,
        height,
        quantity,
        options: { glassType }
      });
      setResult(res.data);
    } catch (err) {
      console.error('Erro ao calcular:', err);
      alert('Erro ao realizar cálculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calculadora Técnica</h1>
          <p className="text-gray-600 mt-2">Cálculo de custos para esquadrias de alumínio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Parâmetros</h2>
            
            {/* Tipologia */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia</label>
              <div className="grid grid-cols-2 gap-3">
                {typologies.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypology(t.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTypology === t.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon || '🪟'}</div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Linha de Produto */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Linha de Produto</label>
              <select
                value={selectedProductLine}
                onChange={e => setSelectedProductLine(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {productLines.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.name} - {pl.supplier}</option>
                ))}
              </select>
            </div>

            {/* Dimensões */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Largura (mm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={e => setWidth(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={300}
                  max={3000}
                  step={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Altura (mm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={300}
                  max={3000}
                  step={100}
                />
              </div>
            </div>

            {/* Quantidade e Vidro */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vidro</label>
                <select
                  value={glassType}
                  onChange={e => setGlassType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FLOAT">Incolor</option>
                  <option value="TEMPERED">Temperado</option>
                  <option value="LAMINATED">Laminado</option>
                  <option value="LOW_E">Low-E</option>
                </select>
              </div>
            </div>

            {/* Botão Calcular */}
            <button
              onClick={handleCalculate}
              disabled={loading || !selectedTypology || !selectedProductLine}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Calculando...' : 'Calcular Custo'}
            </button>
          </div>

          {/* Resultado */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Resumo */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                  <div className="text-center">
                    <div className="text-sm opacity-80 mb-1">PREÇO DE VENDA</div>
                    <div className="text-4xl font-bold mb-2">
                      R$ {result.totals.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm opacity-80">
                      Custo: R$ {result.totals.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                      Margem: {result.totals.profitMargin}%
                    </div>
                  </div>
                </div>

                {/* Detalhamento */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">📦 Perfis</h3>
                  <div className="space-y-2">
                    {result.profiles.map((p: any) => (
                      <div key={p.profileId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-medium text-gray-900">{p.profileName}</div>
                          <div className="text-sm text-gray-500">{p.totalMeters.toFixed(2)}m | {p.barsNeeded} barras</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ {p.totalPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Subtotal Perfis</span>
                      <span>R$ {result.totals.profilesCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Vidros */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">🪟 Vidros</h3>
                  <div className="space-y-2">
                    {result.glasses.map((g: any) => (
                      <div key={g.glassId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-medium text-gray-900">{g.glassName}</div>
                          <div className="text-sm text-gray-500">{g.areaPerUnit.toFixed(2)}m² por unidade</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ {g.totalPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Subtotal Vidros</span>
                      <span>R$ {result.totals.glassesCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Acessórios */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">🔧 Acessórios</h3>
                  <div className="space-y-2">
                    {result.accessories.map((a: any) => (
                      <div key={a.accessoryId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-medium text-gray-900">{a.accessoryName}</div>
                          <div className="text-sm text-gray-500">{a.quantity}x</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">R$ {a.totalPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-semibold">
                      <span>Subtotal Acessórios</span>
                      <span>R$ {result.totals.accessoriesCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Otimização de Corte */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">✂️ Otimização de Corte</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.cutOptimization.totalMetersNeeded}m</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.cutOptimization.totalBarsNeeded}</div>
                      <div className="text-sm text-gray-500">Barras 6m</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-500">{result.cutOptimization.wastePercentage}%</div>
                      <div className="text-sm text-gray-500">Desperdício</div>
                    </div>
                  </div>
                </div>

                {/* Botão Orçar */}
                <button className="w-full py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  Gerar Orçamento
                </button>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🧮</div>
                <div className="text-gray-500">Preencha os parâmetros e clique em "Calcular Custo"</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
