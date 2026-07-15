import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem',
      margin: '1.5rem auto',
      maxWidth: '1200px',
      width: '95%',
      position: 'relative',
      zIndex: 50,
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Shield size={32} color="#FFFFFF" />
        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>
          RapidRelief
        </span>
      </Link>
      
      {/* Desktop Menu */}
      <div className="desktop-menu" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About FYP</Link>
        <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
          <Link to="/login" className="btn-outline" style={{ 
            textDecoration: 'none', 
            padding: '0.5rem 1.5rem', 
            borderRadius: '8px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>Login</Link>
          <Link to="/register-org" className="btn-primary" style={{ textDecoration: 'none' }}>
            Register Authority
          </Link>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
      >
        {isMenuOpen ? <X size={28} color="#FF0055" style={{ filter: 'drop-shadow(0 0 5px #FF0055)' }} /> : <Menu size={28} color="#00F0FF" style={{ filter: 'drop-shadow(0 0 5px #00F0FF)' }} />}
      </button>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="mobile-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '1rem',
          background: 'rgba(10, 15, 25, 0.95)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0, 240, 255, 0.1)'
        }}>
          <Link to="/" className="nav-link" style={{ textAlign: 'center', fontSize: '1.2rem' }} onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/about" className="nav-link" style={{ textAlign: 'center', fontSize: '1.2rem' }} onClick={() => setIsMenuOpen(false)}>About FYP</Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/login" className="btn-outline" style={{ 
              textDecoration: 'none', 
              padding: '1rem', 
              borderRadius: '12px',
              fontWeight: '600',
              textAlign: 'center',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)'
            }} onClick={() => setIsMenuOpen(false)}>Login</Link>
            <Link to="/register-org" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', padding: '1rem', borderRadius: '12px' }} onClick={() => setIsMenuOpen(false)}>
              Register Authority
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
