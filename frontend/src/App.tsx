import { useState, useEffect } from 'react';
import { auth } from './lib/api';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Budgets from './pages/Budgets';
import Orders from './pages/Orders';
import Financial from './pages/Financial';
import Inventory from './pages/Inventory';
import Calculator from './pages/Calculator';
import Materials from './pages/Materials';
import Production from './pages/Production';

// Ícones
import { 
  LayoutDashboard, Users, Package, FileText, ShoppingCart, 
  DollarSign, Box, LogOut, Menu, X, Calculator as CalcIcon
} from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('esquadrias_token'));
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      auth.me()
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('esquadrias_token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = (newToken: string, userData: any) => {
    localStorage.setItem('esquadrias_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('esquadrias_token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'materials', label: 'Materiais', icon: Package },
    { id: 'calculator', label: 'Calculadora', icon: CalcIcon },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'production', label: 'Produção', icon: ShoppingCart },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'inventory', label: 'Estoque', icon: Box },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <Clients />;
      case 'products': return <Products />;
      case 'materials': return <Materials />;
      case 'calculator': return <Calculator />;
      case 'budgets': return <Budgets />;
      case 'orders': return <Orders />;
      case 'production': return <Production />;
      case 'financial': return <Financial />;
      case 'inventory': return <Inventory />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                EsquadriAPI
              </h1>
              <p className="text-xs text-slate-400">Gestão Completa</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-700 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={22} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {user?.user?.name?.[0]?.toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.user?.email}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button onClick={handleLogout} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-semibold text-slate-800 capitalize">
            {currentPage === 'dashboard' ? 'Dashboard' : 
             currentPage === 'financial' ? 'Financeiro' : 
             currentPage === 'inventory' ? 'Estoque' : 
             currentPage}
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {user?.organization?.plan || 'STARTER'}
            </span>
            <span className="text-sm text-slate-500">
              {user?.organization?.name}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
