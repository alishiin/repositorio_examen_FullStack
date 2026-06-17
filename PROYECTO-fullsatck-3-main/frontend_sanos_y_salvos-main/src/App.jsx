import { useState, useEffect } from 'react';
import Inicio from './pages/inicio'
import AdminPage from './pages/admin'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Escuchar cambios en la URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <AuthProvider>
      {currentPage === 'admin' ? (
        <AdminPage />
      ) : (
        <Inicio />
      )}
    </AuthProvider>
  )
}

export default App
