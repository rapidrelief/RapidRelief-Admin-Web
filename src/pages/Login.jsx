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
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="RapidRelief Logo" style={{ width: '100px', height: '100px', marginBottom: '1.2rem', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
          <h1 className="title" style={{ fontSize: '2.4rem', marginBottom: '0.2rem', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RapidRelief</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '400', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Portal</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', wordBreak: 'break-word' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="admin@organization.org"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <label className="label" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Password</label>
            <input 
              type={showPassword ? "text" : "password"}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', paddingRight: '40px' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'linear-gradient(to right, #4f46e5, #6366f1)' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            New organization?{' '}
            <Link to="/register-org" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '500' }}>
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
