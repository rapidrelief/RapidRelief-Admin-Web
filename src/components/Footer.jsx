import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ 
      background: '#0F172A', 
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '4rem 2rem 2rem',
      marginTop: 'auto'
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
            <Shield size={28} color="#60A5FA" />
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>RapidRelief</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Flood Emergency and Rescue Support System. Engineered to maintain critical communication when the grid fails.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontWeight: '600' }}>Legal</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>Privacy Policy</Link></li>
            <li><Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>Terms of Service</Link></li>
            <li><Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>About FYP</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontWeight: '600' }}>Contact Us</h4>
          <a href="mailto:rapidrelief.org@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1rem', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='white'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>
            <Mail size={16} /> rapidrelief.org@gmail.com
          </a>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: '500' }} onMouseOver={e => e.target.style.color='#60A5FA'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>Twitter</a>
            <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: '500' }} onMouseOver={e => e.target.style.color='#60A5FA'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>LinkedIn</a>
            <a href="https://github.com/rapidrelief" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: '500' }} onMouseOver={e => e.target.style.color='#60A5FA'} onMouseOut={e => e.target.style.color='var(--text-muted)'}>GitHub</a>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingTop: '2rem', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.85rem'
      }}>
        &copy; 2026 RapidRelief. All rights reserved.
      </div>
    </footer>
  );
}
