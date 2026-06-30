import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { api } from '../api';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [expandedOrgId, setExpandedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Users Management State
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  
  // Super Admin Management State
  const [newAdminUid, setNewAdminUid] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  // SOS Management State
  const [activeSOS, setActiveSOS] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [selectedSosIds, setSelectedSosIds] = useState([]);
  const [historyTab, setHistoryTab] = useState('sos');
  
  // Simulation State
  const [simZoneId, setSimZoneId] = useState('');
  const [simCount, setSimCount] = useState(50);
  const [simMessage, setSimMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Flood Simulation State
  const [simFloodZoneId, setSimFloodZoneId] = useState('');
  const [simFloodCount, setSimFloodCount] = useState(50);
  const [simFloodMessage, setSimFloodMessage] = useState('');
  const [isSimulatingFlood, setIsSimulatingFlood] = useState(false);

  const fetchData = async () => {
    try {
      const [pendingData, approvedData, activeSosData, historyData, usersSnapshot] = await Promise.all([
        api.getPendingOrgs(),
        api.getApprovedOrgs(),
        api.getGlobalActiveSOS(),
        api.getGlobalSOSHistory(),
        getDocs(collection(db, 'users'))
      ]);
      
      if (pendingData.status === 'success') setOrgs(pendingData.organizations);
      setApprovedOrgs(approvedData);
      setActiveSOS(activeSosData.sos || []);
      setSosHistory(historyData.sos || []);
      
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setRegisteredUsers(usersList);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleApprove = async (org) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      await api.approveOrg(org.id, currentUser.uid);
      try {
        await sendPasswordResetEmail(auth, org.admin_email);
      } catch (emailErr) {}
      fetchData();
    } catch (err) {
      alert('Failed to approve organization');
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm("Are you sure you want to delete this user globally? This action is irreversible.")) return;
    try {
      await api.deleteUser(uid);
      fetchData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleDeleteRescuer = async (uid) => {
    if (!window.confirm("Are you sure you want to delete this rescuer?")) return;
    try {
      await api.deleteUser(uid);
      fetchData();
    } catch (err) {
      alert("Failed to delete rescuer");
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this ENTIRE organization and all its users?")) return;
    try {
      await api.deleteOrg(orgId);
      fetchData();
    } catch (err) {
      alert("Failed to delete organization");
    }
  };

  const handleAddSuperAdmin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    try {
      const res = await fetch('http://localhost:8000/super_admin/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: newAdminUid, secret_key: 'RAPID_RELIEF_SUPER_SECRET' })
      });
      if (res.ok) {
        setAdminMessage('Successfully added Super Admin privileges.');
        setNewAdminUid('');
      } else {
        setAdminMessage('Failed to elevate user.');
      }
    } catch (err) {
      setAdminMessage('Network error occurred.');
    }
  };

  // SOS Handlers
  const handleCompleteSOS = async (sosId) => {
    try {
      await api.completeSOS(sosId, { completed_by_name: 'Super Admin' });
      fetchData();
    } catch (e) {
      alert("Failed to complete SOS");
    }
  };

  const handleDeleteSOS = async (sosId) => {
    if (!window.confirm("Delete this SOS record permanently?")) return;
    try {
      await api.deleteSOS(sosId);
      fetchData();
    } catch (e) {
      alert("Failed to delete SOS");
    }
  };

  const handleMarkAllCompleted = async (listToComplete) => {
    if (!window.confirm(`Mark all ${listToComplete.length} requests as completed?`)) return;
    try {
      await Promise.all(listToComplete.map(sos => api.completeSOS(sos.id, { completed_by_name: 'Super Admin' })));
      fetchData();
    } catch (e) {
      alert("Failed to complete some requests");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSosIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedSosIds.length} records?`)) return;
    try {
      await api.bulkDeleteSOS(selectedSosIds);
      setSelectedSosIds([]);
      fetchData();
    } catch (e) {
      alert("Failed to bulk delete");
    }
  };

  const toggleSosSelection = (id) => {
    setSelectedSosIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllSos = (currentList) => {
    if (selectedSosIds.length === currentList.length) {
      setSelectedSosIds([]);
    } else {
      setSelectedSosIds(currentList.map(s => s.id));
    }
  };

  // Simulation Logic
  const handleSimulateDisaster = async (e) => {
    e.preventDefault();
    if (!simZoneId) return alert("Enter a valid Zone ID");
    setIsSimulating(true);
    setSimMessage('Simulating disaster... 0%');

    const count = parseInt(simCount) || 50;
    let successCount = 0;
    
    for (let i = 0; i < count; i++) {
      try {
        await api.createSOS({
          zone_id: parseInt(simZoneId),
          user_id: `SIM-USER-${Math.floor(Math.random()*10000)}`,
          user_name: `Simulated Victim ${i+1}`,
          user_phone: "555-0199",
          source: "USER",
          lat: 24.8 + (Math.random() * 0.1),
          lng: 67.0 + (Math.random() * 0.1)
        });
        successCount++;
        if (i % 5 === 0) setSimMessage(`Simulating disaster... ${Math.round((i/count)*100)}%`);
      } catch (err) {}
    }
    
    setSimMessage(`Simulation complete! Sent ${successCount} SOS requests.`);
    setIsSimulating(false);
    fetchData();
  };

  const handleSimulateFlood = async (e) => {
    e.preventDefault();
    if (!simFloodZoneId) return alert("Enter a valid Zone ID");
    setIsSimulatingFlood(true);
    setSimFloodMessage('Simulating flood reports... 0%');

    const count = parseInt(simFloodCount) || 50;
    let successCount = 0;
    
    for (let i = 0; i < count; i++) {
      try {
        await api.createSOS({
          zone_id: parseInt(simFloodZoneId),
          user_id: `SIM-FLOOD-${Math.floor(Math.random()*10000)}`,
          user_name: `Simulated Sensor ${i+1}`,
          user_phone: "N/A",
          source: "ZONE_FLOOD",
          lat: 24.8 + (Math.random() * 0.1),
          lng: 67.0 + (Math.random() * 0.1)
        });
        successCount++;
        if (i % 5 === 0) setSimFloodMessage(`Simulating flood reports... ${Math.round((i/count)*100)}%`);
      } catch (err) {}
    }
    
    setSimFloodMessage(`Simulation complete! Sent ${successCount} flood reports.`);
    setIsSimulatingFlood(false);
    fetchData();
  };

  const activeSosList = activeSOS.filter(s => s.source !== 'ZONE_FLOOD');
  const activeFloodList = activeSOS.filter(s => s.source === 'ZONE_FLOOD');
  const filteredHistory = sosHistory.filter(s => historyTab === 'sos' ? s.source !== 'ZONE_FLOOD' : s.source === 'ZONE_FLOOD');

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="header">
        <div>
          <h1 className="title">Super Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage Organizations, SOS, and System Settings</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn-primary" onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '0.5rem 1.5rem' }}>
            Logout
          </button>
          <button className="btn-outline" onClick={fetchData} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
        <button className={activeTab === 'dashboard' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', color: activeTab === 'dashboard' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'dashboard' ? '2px solid #a5b4fc' : '2px solid transparent', whiteSpace: 'nowrap' }}>
          Dashboard
        </button>
        <button className={activeTab === 'organizations' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('organizations')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'organizations' ? 'bold' : 'normal', color: activeTab === 'organizations' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'organizations' ? '2px solid #a5b4fc' : '2px solid transparent', whiteSpace: 'nowrap', position: 'relative' }}>
          Organizations
          {orgs.length > 0 && (
            <span style={{ position: 'absolute', top: '0', right: '-5px', background: '#EF4444', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', minWidth: '20px', height: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 0 2px #0f172a' }}>
              {orgs.length}
            </span>
          )}
        </button>
        <button className={activeTab === 'users' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'users' ? 'bold' : 'normal', color: activeTab === 'users' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'users' ? '2px solid #a5b4fc' : '2px solid transparent', whiteSpace: 'nowrap' }}>
          Users
        </button>
        <button className={activeTab === 'testing' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('testing')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'testing' ? 'bold' : 'normal', color: activeTab === 'testing' ? '#fff' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'testing' ? '2px solid #a5b4fc' : '2px solid transparent', whiteSpace: 'nowrap' }}>
          Testing
        </button>
      </div>

      {/* TESTING TAB CONTENT */}
      {activeTab === 'testing' && (
        <>
          <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid rgba(248, 113, 113, 0.5)' }}>
            <h2 style={{ marginBottom: '1rem', color: '#F87171' }}>🚨 Disaster Simulation Mode (FYP Demo)</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Instantly generate a massive flood of SOS requests to demonstrate system resilience and stress-test the live maps.
            </p>

            {simMessage && (
              <div style={{ background: simMessage.includes('complete') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '8px', color: simMessage.includes('complete') ? '#6ee7b7' : '#93c5fd', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {simMessage}
              </div>
            )}

            <form onSubmit={handleSimulateDisaster} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="label">Target Zone ID</label>
                <input type="number" className="input-field" style={{ marginBottom: 0 }} value={simZoneId} onChange={(e) => setSimZoneId(e.target.value)} required placeholder="e.g. 1" />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="label">Number of SOS Requests</label>
                <input type="number" className="input-field" style={{ marginBottom: 0 }} value={simCount} onChange={(e) => setSimCount(e.target.value)} required min="1" max="500" />
              </div>
              <button type="submit" className="btn-primary" disabled={isSimulating} style={{ background: 'linear-gradient(to right, #EF4444, #B91C1C)', padding: '0.75rem 1.5rem' }}>
                {isSimulating ? 'Simulating...' : '🔥 Launch Simulation'}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
            <h2 style={{ marginBottom: '1rem', color: '#60A5FA' }}>🌊 Flood Simulation Mode (FYP Demo)</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Instantly generate massive flood reports to demonstrate environmental monitoring and area warnings.
            </p>

            {simFloodMessage && (
              <div style={{ background: simFloodMessage.includes('complete') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '8px', color: simFloodMessage.includes('complete') ? '#6ee7b7' : '#93c5fd', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {simFloodMessage}
              </div>
            )}

            <form onSubmit={handleSimulateFlood} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="label">Target Zone ID</label>
                <input type="number" className="input-field" style={{ marginBottom: 0 }} value={simFloodZoneId} onChange={(e) => setSimFloodZoneId(e.target.value)} required placeholder="e.g. 2" />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="label">Number of Flood Reports</label>
                <input type="number" className="input-field" style={{ marginBottom: 0 }} value={simFloodCount} onChange={(e) => setSimFloodCount(e.target.value)} required min="1" max="500" />
              </div>
              <button type="submit" className="btn-primary" disabled={isSimulatingFlood} style={{ background: 'linear-gradient(to right, #3B82F6, #1D4ED8)', padding: '0.75rem 1.5rem' }}>
                {isSimulatingFlood ? 'Simulating...' : '🌊 Launch Flood'}
              </button>
            </form>
          </div>
        </>
      )}

      {activeTab === 'dashboard' && (
        <>
          {/* LIVE SOS SECTION */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#FCD34D' }}>Live SOS Requests</h2>
          {activeSosList.length > 0 && (
            <button onClick={() => handleMarkAllCompleted(activeSosList)} className="btn-primary" style={{ background: '#10B981', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Mark All Completed
            </button>
          )}
        </div>
        {activeSosList.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No active SOS requests at the moment.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0' }}>ID</th>
                  <th style={{ padding: '1rem 0' }}>Victim Name</th>
                  <th style={{ padding: '1rem 0' }}>Source</th>
                  <th style={{ padding: '1rem 0' }}>Time</th>
                  <th style={{ padding: '1rem 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeSosList.map(sos => (
                  <tr key={sos.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{sos.id}</td>
                    <td style={{ padding: '1rem 0' }}>{sos.user_name || 'Unknown'}</td>
                    <td style={{ padding: '1rem 0' }}>{sos.source}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(sos.created_at * 1000).toLocaleTimeString()}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={() => handleCompleteSOS(sos.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#10B981' }}>
                        Mark Completed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LIVE FLOOD SECTION */}
      <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#60A5FA' }}>Live Flood Reports</h2>
          {activeFloodList.length > 0 && (
            <button onClick={() => handleMarkAllCompleted(activeFloodList)} className="btn-primary" style={{ background: '#3B82F6', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Mark All Completed
            </button>
          )}
        </div>
        {activeFloodList.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No active flood reports at the moment.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0' }}>ID</th>
                  <th style={{ padding: '1rem 0' }}>Sensor / Reporter Name</th>
                  <th style={{ padding: '1rem 0' }}>Source</th>
                  <th style={{ padding: '1rem 0' }}>Time</th>
                  <th style={{ padding: '1rem 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeFloodList.map(sos => (
                  <tr key={sos.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{sos.id}</td>
                    <td style={{ padding: '1rem 0' }}>
                      {sos.user_name?.includes('Simulated') ? (
                        <span><span style={{ color: '#FCD34D', fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(252, 211, 77, 0.2)', borderRadius: '4px', marginRight: '6px' }}>TEST FLOOD</span> {sos.user_name}</span>
                      ) : (
                        sos.user_name || 'Unknown'
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Zone ID: {sos.zone_id || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem 0' }}>{sos.source}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(sos.created_at * 1000).toLocaleTimeString()}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={() => handleCompleteSOS(sos.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: '#3B82F6' }}>
                        Mark Completed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HISTORY SECTION */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>
              {historyTab === 'sos' ? 'SOS History Log' : 'Flood History Log'}
            </h2>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              Total: {filteredHistory.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.25rem' }}>
              <button onClick={() => { setHistoryTab('sos'); setSelectedSosIds([]); }} style={{ padding: '0.4rem 1rem', background: historyTab === 'sos' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                SOS
              </button>
              <button onClick={() => { setHistoryTab('flood'); setSelectedSosIds([]); }} style={{ padding: '0.4rem 1rem', background: historyTab === 'flood' ? 'rgba(59, 130, 246, 0.3)' : 'transparent', border: 'none', color: historyTab === 'flood' ? '#93C5FD' : '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                Flood
              </button>
            </div>
            {selectedSosIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '0.5rem 1rem' }}>
                Delete Selected ({selectedSosIds.length})
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No {historyTab} history records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1E293B', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>
                    <input type="checkbox" checked={selectedSosIds.length === filteredHistory.length && filteredHistory.length > 0} onChange={() => toggleAllSos(filteredHistory)} />
                  </th>
                  <th style={{ padding: '1rem 0' }}>ID</th>
                  <th style={{ padding: '1rem 0' }}>{historyTab === 'sos' ? 'Victim Name' : 'Sensor / Reporter Name'}</th>
                  <th style={{ padding: '1rem 0' }}>Completed By</th>
                  <th style={{ padding: '1rem 0' }}>Time</th>
                  <th style={{ padding: '1rem 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(sos => (
                  <tr key={sos.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <input type="checkbox" checked={selectedSosIds.includes(sos.id)} onChange={() => toggleSosSelection(sos.id)} />
                    </td>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{sos.id}</td>
                    <td style={{ padding: '1rem 0' }}>{sos.user_name || 'Unknown'}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{sos.completed_by_name || 'Admin'}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(sos.completed_at * 1000).toLocaleString()}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={() => handleDeleteSOS(sos.id)} style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>



      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Manage Super Admins</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Grant Super Admin privileges to other trusted developers. They must first create an account in the mobile app to generate a Firebase UID.
        </p>
        {adminMessage && (
          <div style={{ background: adminMessage.includes('Success') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '8px', color: adminMessage.includes('Success') ? '#6ee7b7' : '#fca5a5', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {adminMessage}
          </div>
        )}
        <form onSubmit={handleAddSuperAdmin} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Friend's Firebase UID</label>
            <input type="text" className="input-field" style={{ marginBottom: 0 }} value={newAdminUid} onChange={(e) => setNewAdminUid(e.target.value)} required placeholder="e.g. ABC123XYZ..." />
          </div>
          <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(to right, #10B981, #059669)', padding: '0.75rem 1.5rem' }}>
            Grant Access
          </button>
        </form>
      </div>
      </>
      )}

      {/* ORGANIZATIONS TAB */}
      {activeTab === 'organizations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#FCD34D' }}>⏳</span> Pending Organizations
            </h2>
            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
            {loading && <p style={{ color: 'var(--text-muted)' }}>Loading pending applications...</p>}
            
            {!loading && orgs.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                No pending organizations to approve. Everything is caught up!
              </div>
            )}
            
            {!loading && orgs.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {orgs.map(org => (
                  <div key={org.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s, background 0.2s', cursor: 'default' }}
                       onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                       onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                    <div>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.25rem' }}>{org.name}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Admin:</span> <strong style={{ color: '#cbd5e1' }}>{org.admin_name}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Email:</span> <span style={{ color: '#cbd5e1' }}>{org.admin_email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Phone:</span> <span style={{ color: '#cbd5e1' }}>{org.admin_phone}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleApprove(org)} className="btn-primary" style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(to right, #10B981, #059669)', fontSize: '1rem', fontWeight: 'bold' }}>
                      Approve Organization
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#60A5FA' }}>🏛️</span> Approved Organizations
            </h2>
            {!loading && approvedOrgs.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                No approved organizations found.
              </div>
            )}
            
            {!loading && approvedOrgs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {approvedOrgs.map(org => (
                  <div key={org.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{org.name}</h3>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                          ID: ORG-{1000 + org.id}
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{org.address || 'No address provided'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin</div>
                          <div style={{ color: '#cbd5e1' }}>{org.admin_name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>{org.admin_phone}</div>
                        </div>
                        
                        <div style={{ textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                          <div style={{ fontSize: '0.8rem', color: '#a5b4fc', textTransform: 'uppercase' }}>Rescuers</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>{org.total_rescuers}</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)} 
                                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: expandedOrgId === org.id ? 'rgba(99, 102, 241, 0.2)' : '#e2e8f0', color: expandedOrgId === org.id ? '#a5b4fc' : '#0f172a', border: expandedOrgId === org.id ? '1px solid rgba(99, 102, 241, 0.4)' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: expandedOrgId === org.id ? 'none' : '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {expandedOrgId === org.id ? 'Hide Detail' : 'View Rescuers'}
                          </button>
                          <button onClick={() => handleDeleteOrg(org.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>
                            Delete Org
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrgId === org.id && (
                      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#a5b4fc' }}>Rescuers Directory</h4>
                        {org.rescuers.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No rescuers registered yet.</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {org.rescuers.map(r => (
                              <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>{r.name || 'N/A'}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.email}</div>
                                  <div style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{r.phone || 'N/A'}</div>
                                </div>
                                <button onClick={() => handleDeleteRescuer(r.firebase_uid)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }} title="Delete Rescuer">
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* USERS IN NEED OF HELP BANNER */}
          <div style={{ padding: '1rem 1.5rem', borderRadius: '8px', background: activeSOS.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${activeSOS.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeSOS.length > 0 ? '#EF4444' : '#10B981', animation: activeSOS.length > 0 ? 'pulse 1.5s infinite' : 'none', boxShadow: activeSOS.length > 0 ? '0 0 10px rgba(239,68,68,0.8)' : 'none' }}></div>
              <h3 style={{ color: activeSOS.length > 0 ? '#FCA5A5' : '#6EE7B7', margin: 0, fontSize: '1.2rem' }}>
                {activeSOS.length > 0 ? 'Users in Need of Help / Active SOS' : 'All Users Are Currently Safe'}
              </h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: activeSOS.length > 0 ? '#EF4444' : '#10B981', textShadow: activeSOS.length > 0 ? '0 0 10px rgba(239,68,68,0.5)' : 'none' }}>
              {activeSOS.length}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ color: '#fff', margin: 0 }}>
              Global Users Detail <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>({registeredUsers.length} Total)</span>
            </h2>
            <input 
              type="text" 
              placeholder="Search users by name or phone..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              style={{ width: '300px', maxWidth: '100%', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
            />
          </div>
          
          {(() => {
            const filteredUsers = registeredUsers.filter(u => 
              (u.fullName || '').toLowerCase().includes(userSearchTerm.toLowerCase()) || 
              (u.phone || '').includes(userSearchTerm)
            );
            
            if (filteredUsers.length === 0) {
              return (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  {registeredUsers.length === 0 ? 'No registered users found in the system.' : 'No users match your search.'}
                </div>
              );
            }
            
            return filteredUsers.map(u => {
              const allUserSos = [
                ...activeSOS.map(sos => ({ ...sos, isActive: true })),
                ...sosHistory.map(sos => ({ ...sos, isActive: false }))
              ].filter(sos => sos.user_id === u.id || sos.user_name === u.fullName)
              .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

               const isExpanded = expandedUserId === u.id;
              const hasActiveSos = allUserSos.some(sos => sos.isActive);
              
              return (
                <div key={u.id} style={{ background: hasActiveSos ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', border: hasActiveSos ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Name</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{u.fullName || 'Unknown'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                        <div style={{ fontSize: '1.1rem', color: '#fff' }}>{u.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Role</div>
                        <div style={{ fontSize: '1.1rem', color: '#a5b4fc', textTransform: 'capitalize' }}>{u.role || 'User'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Org ID</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{u.organization_id ? `ORG-${1000 + parseInt(u.organization_id)}` : 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {hasActiveSos && (
                        <div style={{ 
                          padding: '0.5rem 1rem', 
                          borderRadius: '30px', 
                          background: 'rgba(239, 68, 68, 0.2)', 
                          border: '2px solid rgba(239, 68, 68, 0.8)',
                          color: '#FCA5A5',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                          animation: 'pulse 1.5s infinite'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>🚨</span>
                          <span>SOS: HELP REQUIRED - NEEDS ATTENTION!</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        className="btn-outline" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: isExpanded ? '#fca5a5' : '#a5b4fc', border: `1px solid ${isExpanded ? '#fca5a5' : '#a5b4fc'}`, background: isExpanded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}
                      >
                        {isExpanded ? 'Hide History' : 'View SOS History'}
                      </button>

                      <button 
                        onClick={() => handleDeleteUser(u.uid || u.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#FCA5A5', border: '1px solid #FCA5A5', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer', borderRadius: '4px' }}
                        title="Delete User Globally"
                      >
                        Delete User
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Global SOS History Log</h4>
                      {allUserSos.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>This user has never triggered an SOS.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {allUserSos.map(sos => {
                            const startDate = sos.created_at ? new Date(sos.created_at * 1000).toLocaleString() : 'Unknown';
                            const endDate = sos.completed_at ? new Date(sos.completed_at * 1000).toLocaleString() : 'Unknown';
                            const diffSeconds = (sos.completed_at && sos.created_at) ? sos.completed_at - sos.created_at : 0;
                            
                            let durationStr = 'Unknown';
                            if (diffSeconds > 0) {
                              const d = Math.floor(diffSeconds / (3600*24));
                              const h = Math.floor(diffSeconds % (3600*24) / 3600);
                              const m = Math.floor(diffSeconds % 3600 / 60);
                              const s = Math.floor(diffSeconds % 60);
                              
                              const parts = [];
                              if (d > 0) parts.push(`${d}d`);
                              if (h > 0 || d > 0) parts.push(`${h}h`);
                              if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
                              parts.push(`${s}s`);
                              
                              durationStr = parts.join(' ');
                            }
                            
                            return (
                              <div key={sos.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${sos.isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.05)'}` }}>
                                
                                <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Time</div>
                                    <div style={{ color: '#fff', fontSize: '0.95rem' }}>{startDate}</div>
                                  </div>
                                  {!sos.isActive && (
                                    <>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>End Time</div>
                                        <div style={{ color: '#fff', fontSize: '0.95rem' }}>{endDate}</div>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                                        <div style={{ color: '#a5b4fc', fontSize: '0.95rem', fontWeight: 'bold' }}>{durationStr}</div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Status / Resolution</div>
                                  {sos.isActive ? (
                                    <span style={{ color: '#FCA5A5', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></div>
                                      LIVE SOS EMERGENCY
                                    </span>
                                  ) : (
                                    <span style={{ color: '#6EE7B7' }}>Cleared by: {sos.completed_by_name} {sos.orgName ? `(${sos.orgName})` : ''}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

    </div>
  );
}
