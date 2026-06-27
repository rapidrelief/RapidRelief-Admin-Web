import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Navbar() {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.5rem 2rem',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Shield size={32} color="#60A5FA" />
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>RapidRelief</span>
      </Link>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About FYP</Link>
        <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
          <Link to="/login" style={{ 
            textDecoration: 'none', 
            color: 'white', 
            padding: '0.5rem 1.2rem', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>Login</Link>
          <Link to="/register-org" style={{ 
            textDecoration: 'none', 
            color: 'white', 
            padding: '0.5rem 1.2rem', 
            borderRadius: '8px',
            background: 'linear-gradient(to right, #4F46E5, #4338CA)',
            fontWeight: '600'
          }}>Register Authority</Link>
        </div>
      </div>
    </nav>
  );
}
