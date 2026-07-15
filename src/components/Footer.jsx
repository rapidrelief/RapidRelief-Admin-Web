import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ 
      background: 'rgba(5, 10, 15, 0.6)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 240, 255, 0.3)',
      boxShadow: '0 -10px 40px rgba(0, 240, 255, 0.1)',
      padding: '4rem 2rem 2rem',
      marginTop: 'auto',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '3rem',
        marginBottom: '3rem'
      }}>
        {/* Brand */}
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <Shield size={28} color="#00F0FF" style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.8))' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>
              Rapid<span style={{ color: '#00F0FF', textShadow: '0 0 15px rgba(0,240,255,0.8)' }}>Relief</span>
            </span>
          </Link>
          <p style={{ color: '#CBD5E1', fontSize: '1rem', lineHeight: '1.6' }}>
            Flood Emergency and Rescue Support System. Engineered to maintain critical communication when the grid fails.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>Legal</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link to="/privacy" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }} onMouseOver={e => { e.target.style.color='#00F0FF'; e.target.style.textShadow='0 0 10px rgba(0, 240, 255, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>Privacy Policy</Link></li>
            <li><Link to="/terms" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }} onMouseOver={e => { e.target.style.color='#00F0FF'; e.target.style.textShadow='0 0 10px rgba(0, 240, 255, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>Terms of Service</Link></li>
            <li><Link to="/about" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '1rem', transition: 'all 0.3s ease' }} onMouseOver={e => { e.target.style.color='#00F0FF'; e.target.style.textShadow='0 0 10px rgba(0, 240, 255, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>About FYP</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>Contact Us</h4>
          <a href="mailto:rapidrelief.org@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', textDecoration: 'none', fontSize: '1rem', marginBottom: '1.5rem', transition: 'all 0.3s ease' }} onMouseOver={e => { e.target.style.color='#FF0055'; e.target.style.textShadow='0 0 10px rgba(255, 0, 85, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>
            <Mail size={18} /> rapidrelief.org@gmail.com
          </a>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <a href="#" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'all 0.3s ease', fontWeight: '600' }} onMouseOver={e => { e.target.style.color='#FF0055'; e.target.style.textShadow='0 0 10px rgba(255, 0, 85, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>Twitter</a>
            <a href="#" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'all 0.3s ease', fontWeight: '600' }} onMouseOver={e => { e.target.style.color='#FF0055'; e.target.style.textShadow='0 0 10px rgba(255, 0, 85, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>LinkedIn</a>
            <a href="https://github.com/rapidrelief" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'all 0.3s ease', fontWeight: '600' }} onMouseOver={e => { e.target.style.color='#FF0055'; e.target.style.textShadow='0 0 10px rgba(255, 0, 85, 0.8)'; }} onMouseOut={e => { e.target.style.color='#94A3B8'; e.target.style.textShadow='none'; }}>GitHub</a>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingTop: '2rem', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        color: '#64748B',
        fontSize: '0.9rem'
      }}>
        &copy; 2026 RapidRelief. All rights reserved.
      </div>
    </footer>
  );
}
