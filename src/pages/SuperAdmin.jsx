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

  const fetchOrgs = async () => {
    try {
      const [pendingData, approvedData] = await Promise.all([
        api.getPendingOrgs(),
        api.getApprovedOrgs()
      ]);
      
      if (pendingData.status === 'success') setOrgs(pendingData.organizations);
      setApprovedOrgs(approvedData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch organizations.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchOrgs();
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
      
      // Send Firebase Email to notify them
      try {
        await sendPasswordResetEmail(auth, org.admin_email);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      // Refresh data
      fetchOrgs();
    } catch (err) {
      console.error(err);
      alert('Failed to approve organization');
    }
  };

  const handleDeleteRescuer = async (uid) => {
    if (!window.confirm("Are you sure you want to delete this rescuer?")) return;
    try {
      await api.deleteUser(uid);
      fetchOrgs(); // Refresh
    } catch (err) {
      console.error(err);
      alert("Failed to delete rescuer");
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!window.confirm("Are you sure you want to delete this ENTIRE organization and all its users?")) return;
    try {
      await api.deleteOrg(orgId);
      fetchOrgs(); // Refresh
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({
          firebase_uid: newAdminUid,
          secret_key: 'RAPID_RELIEF_SUPER_SECRET'
        })
      });
      if (res.ok) {
        setAdminMessage('Successfully added Super Admin privileges to UID: ' + newAdminUid);
        setNewAdminUid('');
      } else {
        setAdminMessage('Failed to elevate user. Ensure the UID is correct.');
      }
    } catch (err) {
      console.error(err);
      setAdminMessage('Network error occurred.');
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="header">
        <div>
          <h1 className="title">Super Admin Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage Organizations and System Settings</p>
        </div>
        <button className="btn-primary" onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}>
          Logout
        </button>
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

      {/* Approved Organizations Section */}
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
                        <button 
                          onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)} 
                          className="btn-outline" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                        >
                          {expandedOrgId === org.id ? 'Hide Rescuers' : 'View Rescuers'}
                        </button>
                        <button 
                          onClick={() => handleDeleteOrg(org.id)} 
                          style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                          Delete Org
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable Rescuers List */}
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
                                      <button 
                                        onClick={() => handleDeleteRescuer(r.firebase_uid)}
                                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                      >
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
            <input 
              type="text" 
              className="input-field" 
              style={{ marginBottom: 0 }}
              value={newAdminUid}
              onChange={(e) => setNewAdminUid(e.target.value)}
              required 
              placeholder="e.g. ABC123XYZ..."
            />
          </div>
          <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(to right, #10B981, #059669)', padding: '0.75rem 1.5rem' }}>
            Grant Access
          </button>
        </form>
      </div>
    </div>
  );
}
