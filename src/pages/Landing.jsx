import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Radio, Activity, Globe, Smartphone, Download } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Landing() {
  return (
    <div className="marketing-container" style={{ position: 'relative' }}>
      <Navbar />

      {/* Decorative Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* HERO SECTION */}
      <section className="hero-section">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', paddingTop: '4rem' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.5rem 1rem', borderRadius: '50px', marginBottom: '2rem' }}>
            <Activity size={18} color="#38bdf8" />
            <span style={{ color: '#38bdf8', fontWeight: '500', fontSize: '0.9rem' }}>Disaster Management Reimagined</span>
          </div>
          
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
            When the Grid Fails, <br/>
            <span className="text-gradient">We Don't.</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: '1.6' }}>
            RapidRelief deploys independent IoT LoRa mesh networks to maintain critical communication 
            during natural disasters, power outages, and cellular grid collapses.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link to="/register-org" style={{ 
              background: 'white', 
              color: '#0F172A', 
              padding: '1rem 2rem', 
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 0 40px rgba(255,255,255,0.2)',
              transition: 'transform 0.2s'
            }}>Deploy a Zone</Link>
            
            <a href="#download-app" style={{ 
              background: 'rgba(255,255,255,0.05)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '1rem 2rem', 
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              textDecoration: 'none',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}><Download size={20} /> Get the App</a>
          </div>
        </motion.div>
      </section>

      {/* APP SHOWCASE SECTION */}
      <section id="download-app" style={{ padding: '6rem 2rem', position: 'relative', zIndex: 10, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '700', marginBottom: '1rem' }}>The Citizen App</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Designed for extreme conditions. Broadcast SOS signals and receive flood alerts completely offline using our proprietary Bluetooth-to-LoRa protocol.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            
            {/* Screenshots container */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative' }}>
              {/* Note to User: Place your screenshots in public/assets/ and name them app-screen-1.png and app-screen-2.png */}
              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <img src="/assets/app-screen-1.png" alt="App Screen 1" style={{ width: '280px', height: 'auto', borderRadius: '24px', border: '8px solid #1E293B', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '280px', height: '580px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '24px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Save your app screenshot as <br/><code>public/assets/app-screen-1.png</code>
                </div>
              </motion.div>
              
              <motion.div initial={{ y: 100, opacity: 0 }} whileInView={{ y: 50, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} style={{ marginTop: '3rem' }}>
                <img src="/assets/app-screen-2.png" alt="App Screen 2" style={{ width: '280px', height: 'auto', borderRadius: '24px', border: '8px solid #1E293B', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '280px', height: '700px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '24px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Save your app screenshot as <br/><code>public/assets/app-screen-2.png</code>
                </div>
              </motion.div>
            </div>

            {/* QR Code and Info */}
            <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Smartphone size={48} color="#A78BFA" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Download RapidRelief</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Scan the QR code below or click the button to install the Android APK directly to your device.</p>
              
              {/* Note to User: Place your QR code in public/assets/ and name it qr-code.png */}
              <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <img src="/assets/qr-code.png" alt="Download QR Code" style={{ width: '200px', height: '200px', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '200px', height: '200px', border: '2px dashed #ccc', alignItems: 'center', justifyContent: 'center', color: '#666', textAlign: 'center', padding: '1rem' }}>
                  Save QR code as <br/><code>public/assets/qr-code.png</code>
                </div>
              </div>

              <a href="/assets/RapidRelief.apk" download style={{ 
                background: 'linear-gradient(to right, #10B981, #059669)', 
                color: 'white', 
                padding: '1rem 3rem', 
                borderRadius: '50px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)'
              }}>
                <Download /> Download APK
              </a>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Requires Android 8.0 or higher.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ padding: '8rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '700', marginBottom: '1rem' }}>Engineered for Extremes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Traditional infrastructure fails when you need it most. We built an entirely parallel communication ecosystem.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Radio size={32} color="#60A5FA" />, title: "LoRa Mesh Network", desc: "Long Range, low power wireless radio frequency technology creates a miles-wide communication canopy." },
              { icon: <Globe size={32} color="#A78BFA" />, title: "Centralized Dashboard", desc: "Disaster Management Authorities get real-time topological mapping of all active hardware nodes and incoming SOS requests." },
              { icon: <Shield size={32} color="#10B981" />, title: "End-to-End Encryption", desc: "Military-grade AES encryption ensures that location broadcasts and emergency signals cannot be intercepted or spoofed." }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="glass-panel"
                style={{ background: 'rgba(30, 41, 59, 0.4)' }}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GOVT / INVESTOR PITCH */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(to bottom, transparent, rgba(79, 70, 229, 0.1))', position: 'relative', zIndex: 10 }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '24px', padding: '4rem 2rem', boxShadow: '0 0 50px rgba(79, 70, 229, 0.1)' }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: '700', marginBottom: '1.5rem' }}>Why Governments Must Adopt RapidRelief</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '2.5rem', textAlign: 'left' }}>
            In the critical 72 hours following a catastrophic event (floods, earthquakes, hurricanes), 
            traditional cellular networks invariably collapse due to power loss or fiber damage. This information 
            blackout costs lives. <br/><br/>
            RapidRelief offers <strong>Disaster Management Authorities</strong> a highly scalable, battery-operated 
            alternative infrastructure. By dropping our localized Gateways and Nodes into a disaster zone, you instantly 
            restore a vast communication canopy. Citizens using our app can immediately send GPS-tagged SOS requests directly 
            to your Command Center, allowing rescuers to prioritize extractions efficiently rather than searching blindly.
          </p>
          <Link to="/register-org" style={{ 
            background: 'linear-gradient(to right, #4F46E5, #4338CA)', 
            color: 'white', 
            padding: '1rem 2.5rem', 
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block'
          }}>Partner With Us Today</Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '4rem 2rem 2rem', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Shield size={32} color="#60A5FA" />
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>RapidRelief</span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', marginBottom: '2rem', lineHeight: '1.6' }}>
            A comprehensive, decentralized disaster management ecosystem. <br/>
            Developed as a Final Year Project (FYP) at <a href="https://www.dsu.edu.pk/" target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: '500' }}>DHA Suffa University</a>.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem 3rem', borderRadius: '16px', marginBottom: '4rem' }}>
            <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Get in Touch</h4>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>For inquiries, partnerships, or support:</p>
            <a href="mailto:rapidrelief.org@gmail.com" style={{ color: '#34D399', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}>rapidrelief.org@gmail.com</a>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>&copy; {new Date().getFullYear()} RapidRelief. All rights reserved.</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
