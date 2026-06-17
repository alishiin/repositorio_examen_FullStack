import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import AuthModal from '../AuthModal/AuthModal';

export default function Header({ onNavigate, currentPage }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleNavClick = (page) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-contact">
          <span>✉️ info@website.com</span>
          <span>📞 +098987 876 767</span>
        </div>
        <div className="header-social">
          <a href="#" className="social-link" title="Facebook">f</a>
          <a href="#" className="social-link" title="Twitter">𝕏</a>
          <a href="#" className="social-link" title="LinkedIn">in</a>
          <a href="#" className="social-link" title="Instagram">📷</a>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo" onClick={() => handleNavClick('home')}>
            <span className="logo-icon">🐾</span>
            <div className="logo-text">
              <h1>Sanos Y salvos</h1>
              <p>Sanos Y salvos website</p>
            </div>
          </div>

          <button 
            className="menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li>
              <a 
                href="#home" 
                onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
                className={currentPage === 'home' ? 'active' : ''}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#map" 
                onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
                className={currentPage === 'map' ? 'active' : ''}
              >
                Mapa
              </a>
            </li>
            <li>
              <a 
                href="#buscar-cercanos" 
                onClick={(e) => { e.preventDefault(); handleNavClick('buscar-cercanos'); }}
                className={currentPage === 'buscar-cercanos' ? 'active' : ''}
              >
                Reportar
              </a>
            </li>
            <li>
              <a 
                href="#faq" 
                onClick={(e) => { e.preventDefault(); handleNavClick('faq'); }}
                className={currentPage === 'faq' ? 'active' : ''}
              >
                FAQ
              </a>
            </li>
          </ul>

          {!isAuthenticated ? (
            <>
              <button 
                className="auth-btn"
                onClick={() => setIsAuthModalOpen(true)}
                title="Iniciar Sesión"
              >
                🔐 Iniciar Sesión
              </button>
              <a 
                href="#admin"
                className="admin-btn"
                title="Panel Administrativo"
              >
                🛡️ Admin
              </a>
            </>
          ) : (
            <div className="auth-buttons">
              <button 
                className="account-btn"
                onClick={() => handleNavClick('cuenta')}
                title="Mi Cuenta"
              >
                👤 {user?.full_name || 'Mi Cuenta'}
              </button>
              <button 
                className="logout-btn"
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                🚪 Salir
              </button>
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
