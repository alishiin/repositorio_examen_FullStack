import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Sanos y salvos</h3>
          <p>Pet Care Website</p>
          <p className="footer-description">
            Providing the best care and services for your beloved pets since 2020.
          </p>
          <div className="social-links">
            <a href="#" title="Facebook">f</a>
            <a href="#" title="Twitter">𝕏</a>
            <a href="#" title="LinkedIn">in</a>
            <a href="#" title="Instagram">📷</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Services</h4>
          <ul>
            <li><a href="#boarding">Dog Boarding</a></li>
            <li><a href="#grooming">Pet Grooming</a></li>
            <li><a href="#adoption">Pet Adoption</a></li>
            <li><a href="#training">Pet Training</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Info</h4>
          <ul className="contact-info">
            <li>📧 <a href="mailto:info@website.com">info@website.com</a></li>
            <li>📞 <a href="tel:+098987876767">+098987 876 767</a></li>
            <li>📍 123 Pet Street, City</li>
            <li>🕐 Open: 9 AM - 6 PM</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 CarePress. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#terms">Terms of Service</a>
          <span>•</span>
          <a href="#cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}
