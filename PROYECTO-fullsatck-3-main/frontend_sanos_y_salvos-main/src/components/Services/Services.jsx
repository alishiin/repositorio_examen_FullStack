import './Services.css';

export default function Services() {
  const services = [
    {
      id: 1,
      icon: '�',
      title: 'Encontrar Mascotas Perdidas',
      description: 'Utilizamos tecnología geolocalización y una comunidad activa para ayudarte a encontrar a tu mascota perdida en el menor tiempo posible.'
    },
    {
      id: 2,
      icon: '🤝',
      title: 'Conectar la Comunidad',
      description: 'Creamos redes de ayuda entre vecinos y voluntarios para compartir información sobre mascotas extraviadas y encontradas.'
    },
    {
      id: 3,
      icon: '❤️',
      title: 'Reunir Familias',
      description: 'Nuestro objetivo es reunir a cada mascota perdida con su familia, brindando esperanza y alegría a todos nuestros usuarios.'
    }
  ];

  return (
    <section id="services" className="services">
      <div className="services-container">
        <h2 className="section-title">Nuestra Misión</h2>
        <p className="section-subtitle">Comprometidos con reunir mascotas perdidas con sus familias</p>
        
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <a href="#" className="service-link">Saber Más →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
