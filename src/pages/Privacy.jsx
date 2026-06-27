import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="marketing-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div className="blob blob-1"></div>

      <section style={{ padding: '8rem 2rem 4rem', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10, flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: '800', marginBottom: '2rem', color: '#fff' }}>Privacy Policy</h1>
        
        <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '3rem', textAlign: 'left', color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}><strong>Last Updated: June 2026</strong></p>
          
          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>1. Data Collection</h3>
          <p style={{ marginBottom: '1.5rem' }}>RapidRelief strictly collects only the data necessary to facilitate emergency rescue operations. This includes your phone number for authentication and precise GPS coordinates when an SOS is triggered. Location data is only transmitted during active emergencies.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>2. Data Usage and Security</h3>
          <p style={{ marginBottom: '1.5rem' }}>Your location data is protected using military-grade AES encryption over LoRa and Bluetooth networks. Data is only accessible to verified Disaster Management Authorities and authorized rescue personnel.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>3. Stagnation Detection</h3>
          <p style={{ marginBottom: '1.5rem' }}>If enabled, Stagnation Detection temporarily caches your local movement history on the device to detect incapacitation. This history is not uploaded to our servers unless an automatic SOS is triggered.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>4. Contact Us</h3>
          <p>For any privacy-related concerns, please contact us at <a href="mailto:rapidrelief.org@gmail.com" style={{ color: '#38bdf8' }}>rapidrelief.org@gmail.com</a>.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
