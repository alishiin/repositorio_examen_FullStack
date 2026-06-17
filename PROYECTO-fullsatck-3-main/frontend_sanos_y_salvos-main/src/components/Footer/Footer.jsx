import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Sanos y Salvos</h3>
          <p>Tu mascota nos importa</p>
          <p className="footer-description">
            Ayudando a las personas a reencontrarse con sus mascotas perdidas.
          </p>
          <div className="social-links">
            <a href="#" title="Facebook">f</a>
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
            <a href="#" title="Instagram">📷</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 Sanos y Salvos. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
