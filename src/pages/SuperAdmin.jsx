import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [expandedOrgId, setExpandedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Super Admin Management State
  const [newAdminUid, setNewAdminUid] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  // SOS Management State
  const [activeSOS, setActiveSOS] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [selectedSosIds, setSelectedSosIds] = useState([]);
  
  // Simulation State
  const [simZoneId, setSimZoneId] = useState('');
  const [simCount, setSimCount] = useState(50);
  const [simMessage, setSimMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchData = async () => {
    try {
      const [pendingData, approvedData, activeSosData, historyData] = await Promise.all([
        api.getPendingOrgs(),
        api.getApprovedOrgs(),
        api.getGlobalActiveSOS(),
        api.getGlobalSOSHistory()
      ]);
      
      if (pendingData.status === 'success') setOrgs(pendingData.organizations);
      setApprovedOrgs(approvedData);
      setActiveSOS(activeSosData.sos || []);
      setSosHistory(historyData.sos || []);
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

  const handleMarkAllCompleted = async () => {
    if (!window.confirm(`Mark all ${activeSOS.length} requests as completed?`)) return;
    try {
      await Promise.all(activeSOS.map(sos => api.completeSOS(sos.id, { completed_by_name: 'Super Admin' })));
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

  const toggleAllSos = () => {
    if (selectedSosIds.length === sosHistory.length) {
      setSelectedSosIds([]);
    } else {
      setSelectedSosIds(sosHistory.map(s => s.id));
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

      {/* DISASTER SIMULATION MODE */}
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

      {/* LIVE SOS SECTION */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#FCD34D' }}>Live SOS Requests</h2>
          {activeSOS.length > 0 && (
            <button onClick={handleMarkAllCompleted} className="btn-primary" style={{ background: '#10B981', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Mark All Completed
            </button>
          )}
        </div>
        {activeSOS.length === 0 ? (
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
                {activeSOS.map(sos => (
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

      {/* SOS HISTORY SECTION */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>SOS History Log</h2>
          {selectedSosIds.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '0.5rem 1rem' }}>
              Delete Selected ({selectedSosIds.length})
            </button>
          )}
        </div>

        {sosHistory.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No SOS history records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1E293B', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>
                    <input type="checkbox" checked={selectedSosIds.length === sosHistory.length && sosHistory.length > 0} onChange={toggleAllSos} />
                  </th>
                  <th style={{ padding: '1rem 0' }}>ID</th>
                  <th style={{ padding: '1rem 0' }}>Victim Name</th>
                  <th style={{ padding: '1rem 0' }}>Completed By</th>
                  <th style={{ padding: '1rem 0' }}>Time</th>
                  <th style={{ padding: '1rem 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sosHistory.map(sos => (
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

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem' }}>Pending Organizations</h2>
        {error && <p style={{ color: '#FCA5A5', marginBottom: '1rem' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading pending applications...</p>}
        {!loading && orgs.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No pending organizations to approve.
          </div>
        )}
        {!loading && orgs.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0' }}>Organization Name</th>
                  <th style={{ padding: '1rem 0' }}>Admin Name</th>
                  <th style={{ padding: '1rem 0' }}>Admin Email</th>
                  <th style={{ padding: '1rem 0' }}>Admin Phone</th>
                  <th style={{ padding: '1rem 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '500' }}>{org.name}</td>
                    <td style={{ padding: '1rem 0' }}>{org.admin_name}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{org.admin_email}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{org.admin_phone}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <button onClick={() => handleApprove(org)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Approve
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
        <h2 style={{ marginBottom: '1rem' }}>Approved Organizations</h2>
        {!loading && approvedOrgs.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            No approved organizations found.
          </div>
        )}
        {!loading && approvedOrgs.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 0' }}>Organization Name</th>
                  <th style={{ padding: '1rem 0' }}>Address</th>
                  <th style={{ padding: '1rem 0' }}>Admin Name (Phone)</th>
                  <th style={{ padding: '1rem 0' }}>Joined</th>
                  <th style={{ padding: '1rem 0' }}>Total Rescuers</th>
                  <th style={{ padding: '1rem 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedOrgs.map(org => (
                  <React.Fragment key={org.id}>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: '500' }}>{org.name}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{org.address || 'N/A'}</td>
                      <td style={{ padding: '1rem 0' }}>{org.admin_name} <br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{org.admin_phone}</span></td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{new Date(org.joined_date * 1000).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                          {org.total_rescuers}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0' }}>
                        <button onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', marginRight: '0.5rem' }}>
                          {expandedOrgId === org.id ? 'Hide Rescuers' : 'View Rescuers'}
                        </button>
                        <button onClick={() => handleDeleteOrg(org.id)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                          Delete Org
                        </button>
                      </td>
                    </tr>
                    {expandedOrgId === org.id && (
                      <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <td colSpan="6" style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                          <h4 style={{ marginBottom: '1rem', color: '#a5b4fc' }}>Rescuers for {org.name}</h4>
                          {org.rescuers.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No rescuers registered yet.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Name</th>
                                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Email</th>
                                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Phone</th>
                                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {org.rescuers.map(r => (
                                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem 0' }}>{r.name || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem 0' }}>{r.email}</td>
                                    <td style={{ padding: '0.75rem 0' }}>{r.phone || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem 0' }}>
                                      <button onClick={() => handleDeleteRescuer(r.firebase_uid)} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
    </div>
  );
}
