import './VeterinaryAbout.css';

export default function VeterinaryAbout() {
  return (
    <section className="veterinary-about">
      <div className="about-container">
        {/* Left side - Image */}
        <div className="about-image-side">
          <div className="about-image-wrapper">
            <img 
              src="https://sadenir.com.uy/wp-content/uploads/2020/11/veterinarian-check-ing-puppy-s-health-2.jpg" 
              alt="Veterinaria" 
              className="about-image"
              onError={(e) => e.target.style.display = 'none'}
            />
            <div className="experience-badge">
              <div className="badge-number">50</div>
              <div className="badge-text">Clínicas Certificadas</div>
            </div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="about-content-side">
          <p className="about-subtitle">// Acerca de Nosotros //</p>
          <h2 className="about-title">La Mejor Veterinaria Para Tu Mascota</h2>
          
          <p className="about-description">
            En nuestra plataforma, conectamos a dueños de mascotas perdidas con una red de veterinarias certificadas y de confianza. Cada clínica asociada cuenta con protocolos de bioseguridad, personal capacitado y todas las certificaciones necesarias para brindar atención de emergencia y apoyo en la reintegración de mascotas extraviadas. Somos tu aliado más confiable en el cuidado y rescate de tus compañeros peludos.
          </p>

          <div className="about-features">
            <div className="feature-item">
              <div className="feature-checkbox checked">✓</div>
              <span className="feature-text">Certificación Veterinaria Completa</span>
            </div>
            <div className="feature-item">
              <div className="feature-checkbox checked">✓</div>
              <span className="feature-text">Protocolos Internacionales</span>
            </div>
            <div className="feature-item">
              <div className="feature-checkbox checked">✓</div>
              <span className="feature-text">Atención 24/7</span>
            </div>
            <div className="feature-item">
              <div className="feature-checkbox checked">✓</div>
              <span className="feature-text">Personal Capacitado en Rescate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
