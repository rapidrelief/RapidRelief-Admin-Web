import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CloudRain, Sun, Cloud, MapPin, CalendarDays, Droplets, Droplet, Info, Cpu, Database, Server, Zap } from 'lucide-react';

export default function AnalyticsPanel({ zones }) {
  const [selectedZone, setSelectedZone] = useState(zones.length > 0 ? zones[0].id : null);
  const [forecastData, setForecastData] = useState([]);
  const [loadingStep, setLoadingStep] = useState(0); // 0 = done, 1 = analyzing, 2 = polishing
  const [error, setError] = useState(null);
  const [daysView, setDaysView] = useState(7);
  const [activeInfo, setActiveInfo] = useState(null);

  // Close active info when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.info-interactive')) {
        setActiveInfo(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedZone) {
      fetchPrediction(selectedZone);
    }
  }, [selectedZone]);

  const fetchPrediction = async (zoneId) => {
    setLoadingStep(1); // Start analyzing phase
    setError(null);
    try {
      const data = await api.getPrediction(zoneId, 14); // Always fetch 14
      setForecastData(data.forecast || []);
      
      // Artificial delay for "Polishing" phase
      setLoadingStep(2);
      setTimeout(() => {
        setLoadingStep(0); // Finished
      }, 2000);

    } catch (err) {
      setError(err.message);
      setLoadingStep(0);
    }
  };

  const toggleInfo = (id) => {
    setActiveInfo(activeInfo === id ? null : id);
  };

  const displayedData = forecastData.slice(0, daysView);

  const maxProb = displayedData.length > 0 ? Math.max(...displayedData.map(d => d.flood_probability)) : 0;
  const maxRain = displayedData.length > 0 ? Math.max(...displayedData.map(d => d.rainfall_mm)) : 0;
  const maxRiver = displayedData.length > 0 ? Math.max(...displayedData.map(d => d.river_level_m)) : 0;

  const getWeatherIcon = (rainfall) => {
    if (rainfall > 5) return <CloudRain size={32} color="#38bdf8" />;
    if (rainfall > 0) return <Cloud size={32} color="#94a3b8" />;
    return <Sun size={32} color="#fbbf24" />;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <style>{`
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse-glow { 
          0%, 100% { box-shadow: 0 0 10px rgba(129, 140, 248, 0.2); transform: scale(1); } 
          50% { box-shadow: 0 0 40px rgba(129, 140, 248, 0.8); transform: scale(1.1); } 
        }
        @keyframes bounce-left { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes bounce-right { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
        @keyframes flash-zap { 0%, 100% { opacity: 0; filter: drop-shadow(0 0 0px #fbbf24); } 50% { opacity: 1; filter: drop-shadow(0 0 15px #fbbf24); } }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>
          AI Flood Prediction Model
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(30, 41, 59, 0.7)', padding: '0.8rem 1.5rem', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <MapPin size={20} color="#a5b4fc" />
          <span style={{ color: '#e2e8f0', fontWeight: '500' }}>Select Zone:</span>
          <select 
            value={selectedZone || ''} 
            onChange={(e) => setSelectedZone(e.target.value)}
            disabled={loadingStep > 0}
            style={{ 
              background: 'transparent', 
              color: 'white', 
              border: 'none', 
              outline: 'none', 
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loadingStep > 0 ? 'not-allowed' : 'pointer',
              opacity: loadingStep > 0 ? 0.5 : 1
            }}
          >
            <option value="" disabled style={{ color: '#000' }}>Select a Zone</option>
            {zones.map(z => (
              <option key={z.id} value={z.id} style={{ color: '#000' }}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingStep > 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
          
          {/* CRAZY MACHINE ANIMATION */}
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Outer Orbit */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', border: '3px dashed rgba(99, 102, 241, 0.4)', borderRadius: '50%', animation: 'spin-slow 4s linear infinite' }} />
            
            {/* Inner Orbit */}
            <div style={{ position: 'absolute', width: '65%', height: '65%', border: '3px dotted rgba(56, 189, 248, 0.6)', borderRadius: '50%', animation: 'spin-reverse 3s linear infinite' }} />
            
            {/* Left Server Node */}
            <div style={{ position: 'absolute', left: '-30px', animation: 'bounce-left 2s ease-in-out infinite', background: 'rgba(15, 23, 42, 0.8)', padding: '0.8rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
              <Database size={32} color="#94a3b8" />
            </div>
            
            {/* Right Server Node */}
            <div style={{ position: 'absolute', right: '-30px', animation: 'bounce-right 2.5s ease-in-out infinite', background: 'rgba(15, 23, 42, 0.8)', padding: '0.8rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
              <Server size={32} color="#94a3b8" />
            </div>
            
            {/* Top Zap (AI Magic) */}
            <div style={{ position: 'absolute', top: '-25px', animation: 'flash-zap 1.5s infinite' }}>
              <Zap size={40} color="#fbbf24" fill="#fbbf24" />
            </div>

            {/* Center Core (CPU) */}
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1.5rem', borderRadius: '50%', animation: 'pulse-glow 1.5s ease-in-out infinite', border: '1px solid rgba(99, 102, 241, 0.5)' }}>
              <Cpu size={48} color="#818cf8" />
            </div>
          </div>

          <div style={{ animation: 'pulse-soft 1.5s ease-in-out infinite', color: '#cbd5e1', fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            {loadingStep === 1 ? 'Injecting physical variables into Machine Learning Core...' : 'Synthesizing 14-day flood predictions...'}
          </div>
        </div>
      )}

      {error && <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171', fontSize: '1.2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px' }}>{error}</div>}
      
      {loadingStep === 0 && !error && forecastData.length > 0 && (
        <>
          {/* HORIZONTAL WEATHER VIEWER */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#e2e8f0', fontSize: '1.2rem', marginBottom: '1rem', paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Upcoming Weather Forecast
              <Info size={16} color="#64748b" style={{ cursor: 'pointer' }} title="Click any card for a daily summary" />
            </h2>
            <div 
              style={{ 
                display: 'flex', 
                gap: '1rem', 
                overflowX: 'auto', 
                paddingBottom: '1rem',
                alignItems: 'flex-start',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
              }}
              className="hide-scrollbar"
            >
              
              {displayedData.map((day, idx) => (
                <div 
                  key={idx} 
                  className="info-interactive"
                  onClick={() => toggleInfo(`day-${idx}`)}
                  style={{ 
                    minWidth: '150px', 
                    background: activeInfo === `day-${idx}` ? 'linear-gradient(145deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 41, 59, 0.9) 100%)' : 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', 
                    borderRadius: '24px', 
                    padding: '1.5rem 1rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    border: activeInfo === `day-${idx}` ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s ease, background 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>{formatDate(day.date)}</span>
                  <div style={{ marginBottom: '1rem' }}>
                    {getWeatherIcon(day.rainfall_mm)}
                  </div>
                  <span style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{day.temperature_c}°</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8', fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>
                    <Droplet size={12} />
                    <span>{day.rainfall_mm}mm</span>
                  </div>

                  {activeInfo === `day-${idx}` && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#bfdbfe', fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.4' }}>
                      On {formatDate(day.date)}, expect a high of {day.temperature_c}°C with {day.rainfall_mm} mm of rain, bringing river levels to {day.river_level_m}m. Risk is {day.risk_level}.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI PREDICTIONS CARD */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.6rem', borderRadius: '12px' }}>
                  <CalendarDays size={24} color="#818cf8" />
                </div>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>AI Flood Predictions</h2>
              </div>

              {/* PILL SELECTOR */}
              <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '30px', padding: '0.3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => setDaysView(7)}
                  style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '30px', 
                    border: 'none', 
                    background: daysView === 7 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: daysView === 7 ? '#fff' : '#94a3b8',
                    fontWeight: daysView === 7 ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: daysView === 7 ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  7 Days
                </button>
                <button 
                  onClick={() => setDaysView(14)}
                  style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '30px', 
                    border: 'none', 
                    background: daysView === 14 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: daysView === 14 ? '#fff' : '#94a3b8',
                    fontWeight: daysView === 14 ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: daysView === 14 ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  14 Days
                </button>
              </div>
            </div>

            {/* GRAPHS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h3 className="info-interactive" style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Flood Risk Probability</span>
                    <Info size={16} color="#94a3b8" style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#94a3b8'} onClick={() => toggleInfo('risk')} />
                  </div>
                  <span style={{ color: '#f87171', fontWeight: 'bold' }}>Alert Level</span>
                </h3>
                
                {activeInfo === 'risk' && (
                  <div className="info-interactive" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', color: '#bfdbfe', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {maxProb === 0 
                      ? `This zone region has no flood warnings in these ${daysView} days. The flood probability stays safely at 0%.`
                      : `Based on the next ${daysView} days, the maximum flood probability reaches ${maxProb}%. ${maxProb > 50 ? 'Flood warnings are highly active for this region.' : 'Stay alert for potential minor warnings.'}`
                    }
                  </div>
                )}

                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayedData}>
                      <defs>
                        <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />
                      <Area type="monotone" dataKey="flood_probability" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorProb)" name="Probability %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <h3 className="info-interactive" style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Rainfall vs River Level</span>
                    <Info size={16} color="#94a3b8" style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#94a3b8'} onClick={() => toggleInfo('physical')} />
                  </div>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Physical Data</span>
                </h3>

                {activeInfo === 'physical' && (
                  <div className="info-interactive" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', color: '#bfdbfe', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Over the next {daysView} days, expected rainfall peaks at {maxRain} mm, and the estimated river level reaches up to {maxRiver} m. This graph shows how rainfall directly affects the river's height.
                  </div>
                )}

                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayedData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#38bdf8" axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="#818cf8" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '1rem' }} />
                      <Line yAxisId="left" type="monotone" dataKey="rainfall_mm" stroke="#38bdf8" name="Rainfall (mm)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="river_level_m" stroke="#818cf8" name="River Level (m)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DATA TABLE */}
            <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', color: '#94a3b8', textAlign: 'left', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Weather</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Rainfall</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Est. River Level</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Soil Moisture</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontWeight: '600' }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map((day, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#f8fafc', fontWeight: '500' }}>{formatDate(day.date)}</td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                          {getWeatherIcon(day.rainfall_mm)}
                          <span>{day.temperature_c}°</span>
                        </div>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#38bdf8', fontWeight: '500' }}>{day.rainfall_mm} mm</td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#818cf8', fontWeight: '500' }}>{day.river_level_m} m</td>
                      <td style={{ padding: '1.2rem 1.5rem', color: '#cbd5e1' }}>{day.soil_moisture_pct}%</td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.4rem 1rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          letterSpacing: '0.05em',
                          background: day.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : day.risk_level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: day.risk_level === 'HIGH' ? '#fca5a5' : day.risk_level === 'MEDIUM' ? '#fcd34d' : '#6ee7b7',
                          border: `1px solid ${day.risk_level === 'HIGH' ? 'rgba(239,68,68,0.3)' : day.risk_level === 'MEDIUM' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
                        }}>
                          {day.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
