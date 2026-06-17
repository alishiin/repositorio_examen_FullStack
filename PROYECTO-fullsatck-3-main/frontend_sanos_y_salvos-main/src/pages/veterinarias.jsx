import './veterinarias.css';

export default function Veterinarias() {
  const veterinarias = [
    {
      id: 1,
      name: 'CarePress Main Clinic',
      address: '123 Pet Street, Downtown City',
      phone: '+098987 876 767',
      email: 'main@carepress.com',
      hours: 'Lun - Dom: 9:00 AM - 6:00 PM',
      services: ['Consulta General', 'Vacunas', 'Cirugía', 'Emergencias'],
      rating: 4.8,
      reviews: 256,
      image: '🏥'
    },
    {
      id: 2,
      name: 'Downtown Pet Care',
      address: '456 Animal Avenue, City Center',
      phone: '+098987 876 768',
      email: 'downtown@carepress.com',
      hours: 'Lun - Sab: 8:00 AM - 7:00 PM',
      services: ['Consulta General', 'Baño y Aseo', 'Adiestramiento', 'Farmacia'],
      rating: 4.7,
      reviews: 189,
      image: '🐾'
    },
    {
      id: 3,
      name: 'Northside Veterinary',
      address: '789 Pets Boulevard, North District',
      phone: '+098987 876 769',
      email: 'north@carepress.com',
      hours: 'Lun - Dom: 10:00 AM - 5:00 PM',
      services: ['Consulta General', 'Odontología', 'Nutrición', 'Análisis'],
      rating: 4.9,
      reviews: 324,
      image: '🐕'
    },
    {
      id: 4,
      name: 'Westside Pet Hospital',
      address: '321 Furry Lane, West End',
      phone: '+098987 876 770',
      email: 'west@carepress.com',
      hours: 'Lun - Sab: 9:00 AM - 6:00 PM',
      services: ['Emergencias', 'Cirugía', 'Laboratorio', 'Imagenología'],
      rating: 4.6,
      reviews: 142,
      image: '🏨'
    }
  ];

  return (
    <section className="veterinarias-section">
      <div className="veterinarias-container">
        <h1 className="veterinarias-title">Nuestras Clínicas Veterinarias</h1>
        <p className="veterinarias-subtitle">Encuentra la clínica más cercana a ti con todos nuestros servicios</p>
        
        <div className="veterinarias-grid">
          {veterinarias.map(vet => (
            <div key={vet.id} className="vet-card">
              <div className="vet-header">
                <div className="vet-image">{vet.image}</div>
                <div className="vet-rating">
                  <span className="stars">{'⭐'.repeat(Math.floor(vet.rating))}</span>
                  <span className="rating-number">{vet.rating}</span>
                  <span className="reviews">({vet.reviews} reviews)</span>
                </div>
              </div>

              <div className="vet-content">
                <h2 className="vet-name">{vet.name}</h2>
                
                <div className="vet-info">
                  <div className="info-row">
                    <span className="icon">📍</span>
                    <span>{vet.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="icon">📞</span>
                    <a href={`tel:${vet.phone}`}>{vet.phone}</a>
                  </div>
                  <div className="info-row">
                    <span className="icon">✉️</span>
                    <a href={`mailto:${vet.email}`}>{vet.email}</a>
                  </div>
                  <div className="info-row">
                    <span className="icon">🕐</span>
                    <span>{vet.hours}</span>
                  </div>
                </div>

                <div className="vet-services">
                  <h4>Servicios</h4>
                  <ul>
                    {vet.services.map((service, idx) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>

                <div className="vet-actions">
                  <a href={`tel:${vet.phone}`} className="btn-call">Llamar Ahora</a>
                  <a href={`mailto:${vet.email}`} className="btn-email">Enviar Email</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="veterinarias-notice">
          <h3>💡 Información Importante</h3>
          <p>
            Todas las clínicas cuentan con personal altamente capacitado y equipamiento de última generación. 
            Recomendamos llamar con anticipación para agendar citas, especialmente en emergencias.
          </p>
        </div>
      </div>
    </section>
  );
}
