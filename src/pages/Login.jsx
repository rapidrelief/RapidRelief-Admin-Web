import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [uid, setUid] = useState(null); // Used for bootstrapping

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUid(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUid = userCredential.user.uid;
      
      const profileData = await api.getProfile(currentUid);
      
      if (!profileData || !profileData.user) {
        setError('Account not registered in Admin system.');
        setUid(currentUid); // Save UID so they can bootstrap
        setLoading(false);
        return;
      }

      if (profileData.user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (profileData.user.role === 'ORG_ADMIN') {
        if (profileData.organization_status !== 'approved') {
          setError('Your organization is currently pending approval from the Super Admin.');
        } else {
          navigate('/org-admin');
        }
      } else {
        setError('Rescuers must use the mobile application.');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleBootstrap = async () => {
    try {
      const res = await fetch('http://localhost:8000/super_admin/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: uid,
          secret_key: 'RAPID_RELIEF_SUPER_SECRET'
        })
      });
      if (res.ok) {
        alert('Success! You are now the Super Admin. Please log in again.');
        setUid(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
      <div className="login-animated-bg" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* Back to Home Button */}
        <Link to="/" style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#00F0FF',
          textDecoration: 'none',
          fontSize: '1.1rem',
          fontWeight: '600',
          background: 'rgba(0, 240, 255, 0.1)',
          padding: '0.8rem 1.5rem',
          borderRadius: '50px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
          transition: 'all 0.3s ease'
        }}>
          &larr; Back to Home
        </Link>

        <div className="glass-panel" style={{ 
          width: '100%', 
          maxWidth: '420px', 
          padding: '3rem 2.5rem', 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255, 255, 255, 0.02)',
          animation: 'cardPulse 3s infinite alternate'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <img src="/logo.png" alt="RapidRelief Logo" style={{ width: '100px', height: '100px', marginBottom: '1.2rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF0055', boxShadow: '0 0 25px rgba(255, 0, 85, 0.5)' }} />
            <h1 className="title" style={{ fontSize: '2.4rem', marginBottom: '0.2rem', letterSpacing: '-0.5px', color: 'white', textShadow: '0 0 15px rgba(0, 240, 255, 0.5)' }}>Rapid<span style={{ color: '#00F0FF' }}>Relief</span></h1>
            <p style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: '500', letterSpacing: '2px', textTransform: 'uppercase' }}>Admin Portal</p>
          </div>
          
          {error && (
            <div style={{ background: 'rgba(255, 0, 85, 0.15)', border: '1px solid rgba(255, 0, 85, 0.5)', padding: '1rem', borderRadius: '12px', color: '#FF0055', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', wordBreak: 'break-word', boxShadow: '0 0 15px rgba(255, 0, 85, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" style={{ color: '#00F0FF', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="admin@organization.org"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
              />
            </div>
            <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
              <label className="label" style={{ color: '#00F0FF', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', paddingRight: '40px', transition: 'all 0.3s ease' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '42px', background: 'none', border: 'none', color: '#00F0FF', cursor: 'pointer', fontSize: '1.2rem', filter: 'drop-shadow(0 0 5px rgba(0,240,255,0.5))' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: '12px', border: 'none', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
              New organization?{' '}
              <Link to="/register-org" style={{ color: '#FF0055', textDecoration: 'none', fontWeight: '700', textShadow: '0 0 10px rgba(255, 0, 85, 0.5)' }}>
                Apply here
              </Link>
            </p>
          </div>
        </div>
    </div>
  );
}
