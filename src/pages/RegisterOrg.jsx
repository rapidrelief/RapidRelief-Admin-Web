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
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem 2.5rem', background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Apply as Organization</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Register your disaster response unit</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px', color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '8px', color: '#6ee7b7', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Organization Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.orgName}
              onChange={(e) => setFormData({...formData, orgName: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Organization Address</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Admin Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.adminName}
              onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Admin Phone</label>
            <input 
              type="tel" 
              className="input-field" 
              value={formData.adminPhone}
              onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Admin Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={formData.adminEmail}
              onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              required 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <label className="label" style={{ color: '#cbd5e1' }}>Admin Password</label>
            <input 
              type={showPassword ? "text" : "password"}
              className="input-field"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
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
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', background: 'linear-gradient(to right, #10B981, #059669)' }} disabled={loading}>
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
