import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function About() {
  const team = [
    { name: "M. AFFAN BAIG", role: "Backend & Hardware Integration" },
    { name: "HAMMAD HASHMI", role: "Documentation & Web Architecture" },
    { name: "SUNDAS FARMAN", role: "App Development" },
    { name: "PARAS BAI", role: "Research & Documentation" }
  ];

  return (
    <div className="marketing-container" style={{ position: 'relative' }}>
      <Navbar />

      <div className="blob blob-1" style={{ background: 'rgba(16, 185, 129, 0.3)' }}></div>

      <section style={{ padding: '8rem 2rem 4rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '1.5rem' }}>The Team Behind <br/><span className="text-gradient">RapidRelief</span></h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            RapidRelief was developed as our Final Year Project (FYP) for <strong><a href="https://www.dsu.edu.pk/" target="_blank" rel="noopener noreferrer" style={{ color: '#60A5FA', textDecoration: 'none' }}>DHA Suffa University</a></strong>. 
            We recognized the devastating impact of communication blackouts during Pakistan's historical floods 
            and set out to engineer a reliable, independent ecosystem that could save lives when traditional grids fail.
          </p>
        </motion.div>
      </section>

      <section style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
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
    </div>
  );
}
