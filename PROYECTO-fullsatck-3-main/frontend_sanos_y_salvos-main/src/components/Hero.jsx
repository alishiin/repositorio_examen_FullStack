import './Hero.css';
import { useState } from 'react';
import perroImage from '../assets/perro.webp';
import perroJardinImage from '../assets/perro-en-un-jardin-2527.jpg';

export default function Hero({ setShowLogin, setShowMap }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    perroImage,
    perroJardinImage
  ];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section 
      className="hero"
      style={{
        backgroundImage: `url(${slides[currentSlide]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-subtitle">// Enjoy Your Holiday //</p>
          <h1 className="hero-title">We Keep Them<br />Happy Anytime.</h1>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setShowLogin(false)}>
              Make Appointment
            </button>
            <button className="btn-phone">
              987-876-876-87
            </button>
          </div>
        </div>
      </div>

      <div className="hero-navigation">
        <button className="nav-arrow prev" onClick={handlePrevSlide}>&lt;</button>
        <button className="nav-arrow next" onClick={handleNextSlide}>&gt;</button>
      </div>
    </section>
  );
}
