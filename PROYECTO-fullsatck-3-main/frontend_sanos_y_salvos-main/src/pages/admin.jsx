import { useState, useEffect } from 'react';
import AdminLogin from '../components/Admin/AdminLogin';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminPetsList from '../components/Admin/AdminPetsList';
import AdminPetDetail from '../components/Admin/AdminPetDetail';
import './admin.css';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, pets, petDetail
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    // Verificar si hay sesión admin guardada
    const savedToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminUser');
    
    if (savedToken && savedAdmin) {
      setIsLoggedIn(true);
      setAdmin(JSON.parse(savedAdmin));
    }
  }, []);

  const handleLoginSuccess = (adminData) => {
    setAdmin(adminData);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    setAdmin(null);
    setCurrentView('dashboard');
    setSelectedPetId(null);
    // Redirigir a home
    window.location.hash = '#home';
  };

  const handleSelectPet = (petId) => {
    setSelectedPetId(petId);
    setCurrentView('petDetail');
  };

  const handleBackToPets = () => {
    setCurrentView('pets');
    setSelectedPetId(null);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-page">
      <nav className="admin-navbar">
        <div className="navbar-left">
          <h1>Panel Administrativo</h1>
          <span className="user-badge">{admin?.name}</span>
        </div>

        <div className="navbar-right">
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${currentView === 'pets' ? 'active' : ''}`}
            onClick={() => setCurrentView('pets')}
          >
            Reportes
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="admin-content">
        {currentView === 'dashboard' && <AdminDashboard />}
        {currentView === 'pets' && (
          <AdminPetsList onSelectPet={handleSelectPet} />
        )}
        {currentView === 'petDetail' && selectedPetId && (
          <AdminPetDetail petId={selectedPetId} onBack={handleBackToPets} />
        )}
      </main>
    </div>
  );
}
