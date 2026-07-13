import { useEffect, useRef, useState } from 'react';
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
import Chat from './chat';

export default function Inicio() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const scrollPositionsRef = useRef(new Map());

  useEffect(() => {
    const handleHashChange = () => {
      const page = window.location.hash.slice(1) || 'home';
      setCurrentPage(page);
      const nextPosition = scrollPositionsRef.current.get(page) ?? 0;
      window.scrollTo(0, nextPosition);
    };

    const handleBeforeUnload = () => {
      scrollPositionsRef.current.set(currentPage, window.scrollY);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPage]);

  const handleNavigate = (page) => {
    scrollPositionsRef.current.set(currentPage, window.scrollY);
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : `#${page}`;
    window.scrollTo(0, scrollPositionsRef.current.get(page) ?? 0);
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

      {currentPage === 'chat' && (
        <Chat />
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
