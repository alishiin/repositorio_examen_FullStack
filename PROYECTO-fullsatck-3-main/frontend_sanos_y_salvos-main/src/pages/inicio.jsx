import { useState } from 'react';
import './inicio.css';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import Services from '../components/Services/Services';
import VeterinaryAbout from '../components/VeterinaryAbout/VeterinaryAbout';
import TestimonialCarousel from '../components/TestimonialCarousel/TestimonialCarousel';
import LoginSection from '../components/LoginSection/LoginSection';
import MapSection from '../components/MapSection/MapSection';
import BuscarCercanos from './buscar-cercanos';
import Footer from '../components/Footer/Footer';
import FAQ from './faq';
import Veterinarias from './veterinarias';
import Cuenta from './cuenta';

export default function Inicio() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="inicio-page">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />
      
      {currentPage === 'home' && (
        <>
          <Hero setShowLogin={() => setCurrentPage('home')} setShowMap={() => setCurrentPage('home')} />
          <Services />
          <VeterinaryAbout />
          <TestimonialCarousel />
        </>
      )}

      {currentPage === 'map' && (
        <MapSection setShowMap={() => setCurrentPage('home')} />
      )}

      {currentPage === 'buscar-cercanos' && (
        <BuscarCercanos onClose={() => setCurrentPage('home')} />
      )}

      {currentPage === 'cuenta' && (
        <Cuenta onNavigate={handleNavigate} />
      )}

      {currentPage === 'faq' && (
        <FAQ />
      )}

      {currentPage === 'veterinarias' && (
        <Veterinarias />
      )}

      {currentPage === 'contact' && (
        <div className="page-placeholder">
          <h2>Contact Us</h2>
          <p>Coming soon...</p>
        </div>
      )}

      <Footer />
    </div>
  );
}
