import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './lib/api';
import AppLayout from './components/layout/AppLayout';

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

function App() {
  const [token, setToken] = useState(localStorage.getItem('esquadrias_token'));
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

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
    <AppLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      user={user?.user}
    >
      {renderPage()}
    </AppLayout>
  );
}

export default App;
