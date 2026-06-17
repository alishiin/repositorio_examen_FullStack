import './Services.css';

export default function Services() {
  const services = [
    {
      id: 1,
      icon: '🐕',
      title: 'Dog Boarding',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Safe and comfortable boarding for your beloved pets.'
    },
    {
      id: 2,
      icon: '🐾',
      title: 'Dog Boarding',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Professional care and supervision 24/7.'
    },
    {
      id: 3,
      icon: '🏠',
      title: 'Pet Adoption',
      description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Find your new furry family member today.'
    }
  ];

  return (
    <section id="services" className="services">
      <div className="services-container">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">We provide the best care for your pets</p>
        
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <a href="#" className="service-link">Learn More →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
