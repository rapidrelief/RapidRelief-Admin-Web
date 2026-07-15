import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';

export default function RegisterOrg() {
  const [formData, setFormData] = useState({
    orgName: '',
    address: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.adminEmail, formData.password);
      const uid = userCredential.user.uid;

      // 2. Register Org in Backend
      const res = await api.registerOrg({
        org_name: formData.orgName,
        address: formData.address,
        admin_firebase_uid: uid,
        admin_email: formData.adminEmail,
        admin_name: formData.adminName,
        admin_phone: formData.adminPhone
      });

      if (res.status === 'success') {
        setSuccess('Organization application submitted! Waiting for Super Admin approval.');
        setTimeout(() => navigate('/login'), 4000);
      } else {
        setError('Failed to register organization in backend.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to register.');
    }
    setLoading(false);
  };

  return (
    <div className="login-animated-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', padding: '2rem 0' }}>
      
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
        transition: 'all 0.3s ease',
        zIndex: 50
      }}>
        &larr; Back to Home
      </Link>

      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '3rem 2.5rem', 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255, 255, 255, 0.02)',
        animation: 'cardPulse 3s infinite alternate',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.2rem', color: 'white', textShadow: '0 0 15px rgba(0, 240, 255, 0.5)' }}>Apply as Organization</h1>
          <p style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Register your disaster response unit</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(255, 0, 85, 0.15)', border: '1px solid rgba(255, 0, 85, 0.5)', padding: '1rem', borderRadius: '12px', color: '#FF0055', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', boxShadow: '0 0 15px rgba(255, 0, 85, 0.2)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid rgba(57, 255, 20, 0.5)', padding: '1rem', borderRadius: '12px', color: '#39FF14', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', boxShadow: '0 0 15px rgba(57, 255, 20, 0.2)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.orgName}
              onChange={(e) => setFormData({...formData, orgName: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Organization Address</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.adminName}
              onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Phone</label>
            <input 
              type="tel" 
              className="input-field" 
              value={formData.adminPhone}
              onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={formData.adminEmail}
              onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
            />
          </div>
          <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
            <label className="label" style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Password</label>
            <input 
              type={showPassword ? "text" : "password"}
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 240, 255, 0.3)', color: '#fff', paddingRight: '40px', borderRadius: '12px', padding: '1rem', width: '100%', boxSizing: 'border-box', marginTop: '0.5rem', transition: 'all 0.3s ease' }}
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
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ color: '#CBD5E1', fontSize: '0.95rem' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#FF0055', textDecoration: 'none', fontWeight: '700', textShadow: '0 0 10px rgba(255, 0, 85, 0.5)' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
