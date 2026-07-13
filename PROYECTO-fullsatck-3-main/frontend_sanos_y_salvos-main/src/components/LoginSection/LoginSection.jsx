import { useState } from 'react';
import UiDialog from '../UiDialog/UiDialog';
import './LoginSection.css';

export default function LoginSection({ setShowLogin }) {
  const [username, setUsername] = useState('');  // ← CAMBIAR a username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, tone: 'success', title: '', message: '' });

  const API_BASE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,  // ← CAMBIAR de email a username
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Guardar tokens correctamente
      if (data.access) {  // ← CAMBIAR de data.token a data.access
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setDialog({ open: true, tone: 'success', title: 'Inicio de sesión', message: 'Login successful!' });
      setShowLogin(false);
    } catch (err) {
      setError(err.message || 'Error during login. Please try again.');
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
              <label htmlFor="username">Username</label>  {/* ← CAMBIAR de email a username */}
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

      <UiDialog
        open={dialog.open}
        tone={dialog.tone}
        title={dialog.title}
        message={dialog.message}
        confirmLabel="Aceptar"
        onConfirm={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </section>
  );
}