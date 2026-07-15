import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Radio, Activity, Globe, Smartphone, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <div className="marketing-container" style={{ 
      position: 'relative',
      backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.8)), url("/assets/background-1.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'top center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      <Navbar />

      {/* Decorative Background Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <section className="hero-section">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '850px', margin: '-2rem auto 0 auto', paddingTop: '0' }}
        >
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '4rem 3rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 0, 85, 0.15)', border: '1px solid rgba(255, 0, 85, 0.4)', padding: '0.5rem 1rem', borderRadius: '50px', marginBottom: '2rem', boxShadow: '0 0 10px rgba(255, 0, 85, 0.2)' }}>
              <Activity size={18} color="#FF0055" />
              <span style={{ color: '#FF0055', fontWeight: '600', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Disaster Management Reimagined</span>
            </div>
            
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              When the Grid Fails, <br/>
              <span className="text-gradient">We Don't.</span>
            </h1>
            
            <p style={{ fontSize: '1.25rem', color: '#E2E8F0', marginBottom: '3rem', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 3rem auto', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              RapidRelief deploys independent IoT LoRa mesh networks to maintain critical communication 
              during natural disasters, power outages, and cellular grid collapses.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            
            <a href="#download-app" onClick={(e) => {
              e.preventDefault();
              const section = document.getElementById('download-app');
              if (section) {
                const y = section.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }} style={{ 
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
          </div>
        </motion.div>
      </section>

      {/* APP SHOWCASE SECTION */}
      <section id="download-app" style={{ padding: '6rem 2rem', position: 'relative', zIndex: 10, background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(0, 240, 255, 0.1)', borderBottom: '1px solid rgba(0, 240, 255, 0.1)', boxShadow: '0 0 50px rgba(0, 240, 255, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '5rem' }}
          >
            <h2 className="title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem', textShadow: '0 0 20px rgba(255, 0, 85, 0.3)' }}>The Citizen App</h2>
            <p style={{ color: '#E2E8F0', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              Designed for extreme conditions. Broadcast SOS signals and receive flood alerts completely offline using our proprietary Bluetooth-to-LoRa protocol.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            {/* Screenshots container */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', position: 'relative' }}>
              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} animate={{ y: [0, -15, 0] }} transition={{ delay: 0.1, animate: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}>
                <img src="/assets/app-screen-1.png" alt="App Screen 1" style={{ width: '100%', maxWidth: '280px', height: 'auto', borderRadius: '32px', border: '2px solid rgba(0, 240, 255, 0.5)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.2)', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '280px', height: '580px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Save your app screenshot as <br/><code>public/assets/app-screen-1.png</code>
                </div>
              </motion.div>
              <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} animate={{ y: [0, -15, 0] }} transition={{ delay: 0.3, animate: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } }} style={{ marginTop: '3rem' }}>
                <img src="/assets/app-screen-2.png" alt="App Screen 2" style={{ width: '100%', maxWidth: '280px', height: 'auto', borderRadius: '32px', border: '2px solid rgba(255, 0, 85, 0.5)', boxShadow: '0 0 40px rgba(255, 0, 85, 0.2), inset 0 0 20px rgba(255, 0, 85, 0.2)', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '280px', height: '700px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Save your app screenshot as <br/><code>public/assets/app-screen-2.png</code>
                </div>
              </motion.div>
            </div>

            {/* QR Code and Info */}
            <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(57,255,20,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
              <Smartphone size={56} color="#39FF14" style={{ marginBottom: '1rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.6))' }} />
              <h3 style={{ fontSize: '2.5rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>Download RapidRelief</h3>
              <p style={{ color: '#E2E8F0', marginBottom: '2rem', fontSize: '1.1rem', position: 'relative', zIndex: 1 }}>Scan the QR code below or click the button to install the Android APK directly to your device.</p>
              
              <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '20px', marginBottom: '2.5rem', position: 'relative', zIndex: 1, boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                <img src="/assets/qr-code.png" alt="Download QR Code" style={{ width: '220px', height: '220px', display: 'block' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                <div style={{ display: 'none', width: '220px', height: '220px', border: '2px dashed #ccc', alignItems: 'center', justifyContent: 'center', color: '#666', textAlign: 'center', padding: '1rem' }}>
                  Save QR code as <br/><code>public/assets/qr-code.png</code>
                </div>
              </div>

              <a href="/assets/RapidRelief.apk" download className="btn-primary" style={{ textDecoration: 'none', position: 'relative', zIndex: 1, fontSize: '1.3rem', padding: '1.2rem 3rem' }}>
                <Download style={{ marginRight: '0.5rem' }} /> Download APK
              </a>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Requires Android 8.0 or higher.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ padding: '8rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h2 className="title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1.5rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}>Engineered for Extremes</h2>
            <p style={{ color: '#E2E8F0', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Traditional infrastructure fails when you need it most. We built an entirely parallel communication ecosystem.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            {[
              { icon: <Radio size={40} color="#00F0FF" style={{ filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.8))' }} />, title: "LoRa Mesh Network", desc: "Long Range, low power wireless radio frequency technology creates a miles-wide communication canopy.", glow: "#00F0FF" },
              { icon: <Globe size={40} color="#FF0055" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,85,0.8))' }} />, title: "Centralized Dashboard", desc: "Disaster Management Authorities get real-time topological mapping of all active hardware nodes and incoming SOS requests.", glow: "#FF0055" },
              { icon: <Shield size={40} color="#F59E0B" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.8))' }} />, title: "End-to-End Encryption", desc: "Military-grade AES encryption ensures that location broadcasts and emergency signals cannot be intercepted or spoofed.", glow: "#F59E0B" }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${feat.glow}40, inset 0 0 20px ${feat.glow}20`, borderColor: feat.glow }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, type: 'spring', stiffness: 300 }}
                className="glass-panel"
                style={{ 
                  background: 'rgba(10, 15, 25, 0.6)', 
                  padding: '2.5rem',
                  border: `1px solid ${feat.glow}40`,
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ background: `rgba(255,255,255,0.05)`, padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '2rem', border: `1px solid ${feat.glow}30` }}>
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{feat.title}</h3>
                <p style={{ color: '#CBD5E1', lineHeight: '1.7', fontSize: '1.1rem' }}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT METRICS SECTION */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(5, 10, 15, 0.7)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(0, 240, 255, 0.2)', borderBottom: '1px solid rgba(255, 0, 85, 0.2)', position: 'relative', zIndex: 10, boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: '#00F0FF', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.6)' }}>5km+</div>
              <div style={{ color: '#E2E8F0', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Radio Canopy Range<br/>(LoRa Band)</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: '#39FF14', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(57, 255, 20, 0.6)' }}>10 sec</div>
              <div style={{ color: '#E2E8F0', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Cascaded Network<br/>Failover Time</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: '#F59E0B', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(245, 158, 11, 0.6)' }}>&lt; 5 sec</div>
              <div style={{ color: '#E2E8F0', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>SOS Delivery<br/>Latency</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div style={{ fontSize: '4rem', fontWeight: '900', color: '#FF0055', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(255, 0, 85, 0.6)' }}>100%</div>
              <div style={{ color: '#E2E8F0', fontSize: '1.2rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Offline Capabilities<br/>& Independence</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GOVT / INVESTOR PITCH */}
      <section style={{ padding: '8rem 2rem', background: 'linear-gradient(to bottom, transparent, rgba(255, 0, 85, 0.05))', position: 'relative', zIndex: 10 }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', background: 'rgba(10, 15, 25, 0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 0, 85, 0.3)', borderRadius: '32px', padding: '5rem 3rem', boxShadow: '0 0 50px rgba(255, 0, 85, 0.1), inset 0 0 30px rgba(255, 0, 85, 0.05)' }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800', marginBottom: '2rem', textShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }}>Why Governments Must Adopt RapidRelief</h2>
          <p style={{ color: '#CBD5E1', fontSize: '1.25rem', lineHeight: '1.8', marginBottom: '3rem', textAlign: 'left' }}>
            In the critical <strong style={{ color: '#FF0055', textShadow: '0 0 10px rgba(255,0,85,0.5)' }}>72 hours</strong> following a catastrophic event (floods, earthquakes, hurricanes), 
            traditional cellular networks invariably collapse due to power loss or fiber damage. This information 
            blackout costs lives. <br/><br/>
            RapidRelief offers <strong style={{ color: '#00F0FF', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>Disaster Management Authorities</strong> a highly scalable, battery-operated 
            alternative infrastructure. By dropping our localized Gateways and Nodes into a disaster zone, you instantly 
            restore a vast communication canopy. Citizens using our app can immediately send GPS-tagged SOS requests directly 
            to your Command Center, allowing rescuers to prioritize extractions efficiently rather than searching blindly.
          </p>
          <Link to="/register-org" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1.4rem', padding: '1.2rem 3rem' }}>
            Partner With Us Today
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
