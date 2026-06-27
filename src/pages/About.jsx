import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Radio, Cpu, Wifi, Monitor, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function About() {
  const team = [
    { name: "M. AFFAN BAIG", role: "Backend & Hardware Integration" },
    { name: "HAMMAD HASHMI", role: "Documentation & Web Architecture" },
    { name: "SUNDAS FARMAN", role: "App Development" },
    { name: "PARAS BAI", role: "Research & Documentation" }
  ];

  const architectureSteps = [
    { icon: Smartphone, label: "Citizen App", detail: "Bluetooth Offline Connection", color: "#60A5FA" },
    { icon: Cpu, label: "LoRa Node", detail: "Long-Range Radio Transmission", color: "#34D399" },
    { icon: Radio, label: "Gateway", detail: "Receives Radio, Connects to Web", color: "#FBBF24" },
    { icon: Wifi, label: "Cloud Server", detail: "Data Processing & Storage", color: "#A78BFA" },
    { icon: Monitor, label: "Command Dashboard", detail: "Live Monitoring & Dispatch", color: "#F87171" }
  ];

  return (
    <div className="marketing-container" style={{ position: 'relative' }}>
      <Navbar />

      <div className="blob blob-1" style={{ background: 'rgba(16, 185, 129, 0.3)' }}></div>

      <section style={{ padding: '8rem 2rem 4rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '800', marginBottom: '1.5rem' }}>The Team Behind <br/><span className="text-gradient">RapidRelief</span></h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            RapidRelief was developed as our Final Year Project (FYP) for <strong><a href="https://www.dsu.edu.pk/" target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'none' }}>DHA Suffa University</a></strong>. 
            We recognized the devastating impact of communication blackouts during Pakistan's historical floods 
            and set out to engineer a reliable, independent ecosystem that could save lives when traditional grids fail.
          </p>
        </motion.div>
      </section>

      <section style={{ padding: '2rem 2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          {team.map((member, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.15 }}
              className="glass-panel"
              style={{ textAlign: 'center', background: 'rgba(30, 41, 59, 0.6)' }}
            >
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', border: '4px solid rgba(255,255,255,0.1)' }}>
                {member.name.charAt(0)}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>{member.name}</h3>
              <p style={{ color: '#34D399', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>System Architecture</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>How an offline SOS signal travels from a victim to the command center.</p>
        </div>

        <div className="architecture-flow">
          {architectureSteps.map((step, idx) => (
            <React.Fragment key={idx}>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                className="glass-panel"
                style={{ textAlign: 'center', flex: '1', minWidth: '180px', padding: '2rem 1rem', background: 'rgba(15, 23, 42, 0.6)' }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: `rgba(255,255,255,0.05)`, border: `1px solid ${step.color}`, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <step.icon size={40} color={step.color} />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#fff' }}>{step.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{step.detail}</p>
              </motion.div>

              {idx < architectureSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx * 0.2) + 0.1, duration: 0.5 }}
                  className="arch-arrow"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}
                >
                  <ArrowRight size={32} />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

    </div>
  );
}
