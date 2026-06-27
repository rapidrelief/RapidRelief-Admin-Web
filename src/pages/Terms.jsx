import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="marketing-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <div className="blob blob-2" style={{ right: 0, left: 'auto', background: 'rgba(167, 139, 250, 0.2)' }}></div>

      <section style={{ padding: '8rem 2rem 4rem', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10, flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: '800', marginBottom: '2rem', color: '#fff' }}>Terms of Service</h1>
        
        <div className="glass-panel" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '3rem', textAlign: 'left', color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '1.5rem' }}><strong>Last Updated: June 2026</strong></p>
          
          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>1. Acceptance of Terms</h3>
          <p style={{ marginBottom: '1.5rem' }}>By accessing and using the RapidRelief application and hardware nodes, you agree to be bound by these Terms of Service. RapidRelief is provided as a best-effort emergency support system.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>2. Best-Effort Service</h3>
          <p style={{ marginBottom: '1.5rem' }}>While RapidRelief is engineered with robust cascaded failover mechanisms, no communication system is infallible. We do not guarantee 100% uptime, especially in extreme catastrophic events where hardware nodes may be physically destroyed.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>3. Proper Usage</h3>
          <p style={{ marginBottom: '1.5rem' }}>The SOS function is strictly for life-threatening emergencies. Intentional false alarms or misuse of the network infrastructure may result in permanent bans and reporting to local authorities.</p>

          <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem', marginTop: '2rem' }}>4. Limitation of Liability</h3>
          <p>RapidRelief and DHA Suffa University shall not be held liable for any damages, injuries, or loss of life resulting from delays or failures in emergency communication routing.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
