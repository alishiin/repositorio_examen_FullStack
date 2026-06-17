import './TestimonialCarousel.css';
import { useState } from 'react';

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'María González',
      role: 'Mamá de Bruno',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      text: 'Gracias a la aplicación Sanos y Salvos encontré a mi perro Bruno que se perdió cuando se quedó la puerta abierta. En menos de 24 horas fue registrado en una clínica certificada y pude traerlo de vuelta a casa. ¡Muy agradecida!'
    },
    {
      id: 2,
      name: 'Carlos Ruiz',
      role: 'Dueño de Luna',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      text: 'Mi gata Luna desapareció por tres días. Cuando la registré en Sanos y Salvos, una veterinaria certificada la había encontrado. El sistema de notificaciones es increíble y muy confiable. ¡La mejor decisión!'
    },
    {
      id: 3,
      name: 'Ana Rodríguez',
      role: 'Mamá de Max y Bella',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      text: 'Dos de mis mascotas se perdieron juntas. Con Sanos y Salvos, ambas fueron encontradas en diferentes clínicas certificadas. El equipo de profesionales fue tan solidario y responsable. ¡Recomiendo ampliamente!'
    },
    {
      id: 4,
      name: 'Juan Martinez',
      role: 'Adoptante de Rocky',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      text: 'Encontré a Rocky gracias a Sanos y Salvos y tras no encontrar a su dueño, decidí adoptarlo. La plataforma no solo te ayuda a encontrar mascotas perdidas, ¡también crea familias!'
    },
    {
      id: 5,
      name: 'Sofía Torres',
      role: 'Mamá de Milo',
      image: 'https://images.unsplash.com/photo-1507599912169-403cb910d4bf?w=150&h=150&fit=crop',
      text: 'Mi conejo Milo se escapó de casa y estaba muy asustado. La clínica certificada que lo encontró le brindó toda la atención necesaria. ¡Gracias Sanos y Salvos por devolver la seguridad a mi hogar!'
    }
  ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const current = testimonials[currentIndex];

  return (
    <section className="testimonial-section">
      {/* Background avatars */}
      <div className="bg-avatars">
        {testimonials.map((testimonial, index) => (
          <img
            key={`bg-${testimonial.id}`}
            src={testimonial.image}
            alt={testimonial.name}
            className={`bg-avatar avatar-${index}`}
          />
        ))}
      </div>

      <div className="testimonial-container">
        <h2 className="testimonial-title">Experiencias de Usuarios</h2>
        
        <div className="testimonial-carousel">
          {/* Carousel content */}
          <div className="carousel-content">
            <div className="testimonial-image">
              <img 
                src={current.image} 
                alt={current.name}
                className="profile-image"
              />
            </div>
            
            <div className="testimonial-content">
              <h3 className="testimonial-name">{current.name}</h3>
              <p className="testimonial-role">{current.role}</p>
              <p className="testimonial-text">"{current.text}"</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="carousel-navigation">
            <button className="carousel-btn prev" onClick={handlePrev}>&lt;</button>
            <div className="carousel-dots">
              {testimonials.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                ></span>
              ))}
            </div>
            <button className="carousel-btn next" onClick={handleNext}>&gt;</button>
          </div>
        </div>
      </div>
    </section>
  );
}
