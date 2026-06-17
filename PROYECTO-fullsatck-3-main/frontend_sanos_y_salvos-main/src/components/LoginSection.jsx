import { useState } from 'react';
import './LoginSection.css';

export default function LoginSection({ setShowLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = { email, password };
    console.log('📤 Enviando:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Respuesta:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      alert('✅ Login successful!');
      setShowLogin(false);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section">
      <button className="close-btn" onClick={() => setShowLogin(false)}>✕</button>
      
      <div className="login-container">
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="matias@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-links">
            <a href="#forgot">Forgot password?</a>
            <span>•</span>
            <a href="#register">Create account</a>
          </div>
        </div>

        <div className="login-image">
          <div className="image-placeholder">🔐</div>
          <h3>Secure Login</h3>
          <p>Your information is secure with us</p>
        </div>
      </div>
    </section>
  );
}