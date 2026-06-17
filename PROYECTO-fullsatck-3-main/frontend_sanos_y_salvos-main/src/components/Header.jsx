import { useState } from 'react';
import './Header.css';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-contact">
          <span>✉️ info@website.com</span>
          <span>📞 +098987 876 767</span>
        </div>
        <div className="header-social">
          <a href="#" className="social-link">f</a>
          <a href="#" className="social-link">𝕏</a>
          <a href="#" className="social-link">in</a>
          <a href="#" className="social-link">Be</a>
          <a href="#" className="social-link">P</a>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <span className="logo-icon">🐾</span>
            <div className="logo-text">
              <h1>CarePress</h1>
              <p>Pet Care Website</p>
            </div>
          </div>

          <button 
            className="menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>

          <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#home" className="active">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#pages">Pages</a></li>
            <li><a href="#news">News</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <button className="get-appointment-btn">Get Appointment</button>
        </div>
      </nav>
    </header>
  );
}
