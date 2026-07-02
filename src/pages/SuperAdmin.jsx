import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { api } from '../api';
import AnalyticsPanel from '../components/AnalyticsPanel';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [expandedOrgId, setExpandedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalZones, setGlobalZones] = useState([]);
  
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

  // Report Management State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showViewAlertsModal, setShowViewAlertsModal] = useState(false);
  const [superAdminAlerts, setSuperAdminAlerts] = useState([]);
  const [replyFormAlertId, setReplyFormAlertId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [reportForm, setReportForm] = useState({
    organization_id: '',
    priority: 'Medium',
    report_type: 'Notification',
    subject: '',
    message: ''
  });
  const [reportMsg, setReportMsg] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Universal Messaging System State
  const [messages, setMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messageForm, setMessageForm] = useState({ receiver_uid: '', subject: '', content: '' });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const unreadMessagesCount = messages.filter(m => !m.is_read).length;

  const fetchData = async () => {
    try {
      const currentUser = auth.currentUser;
      const [pendingData, approvedData, activeSosData, historyData, usersSnapshot, globalZonesData] = await Promise.all([
        api.getPendingOrgs(),
        api.getApprovedOrgs(),
        api.getGlobalActiveSOS(),
        api.getGlobalSOSHistory(),
        getDocs(collection(db, 'users')),
        api.getGlobalZones(currentUser?.uid)
      ]);
      
      if (pendingData.status === 'success') setOrgs(pendingData.organizations);
      setApprovedOrgs(approvedData);
      setActiveSOS(activeSosData.sos || []);
      setSosHistory(historyData.sos || []);
      if (Array.isArray(globalZonesData)) setGlobalZones(globalZonesData);
      
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

  const fetchMessages = async () => {
    try {
      const res = await api.getInboxMessages();
      const newMessages = res.messages || [];
      const oldUnread = messages.filter(m => !m.is_read).map(m => m.id);
      const newlyUnread = newMessages.filter(m => !m.is_read && !oldUnread.includes(m.id));
      if (newlyUnread.length > 0 && messages.length > 0) {
        // Just rely on the indicator, or use toast if imported
      }
      setMessages(newMessages);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.getMessageContacts();
      setContacts(res.contacts || []);
    } catch (e) {
      console.error("Failed to fetch contacts", e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.receiver_uid || !messageForm.subject || !messageForm.content) return;
    setIsSendingMessage(true);
    try {
      await api.sendMessage(messageForm);
      setShowComposeModal(false);
      setMessageForm({ receiver_uid: '', subject: '', content: '' });
      alert("Message sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleMarkMessageRead = async (messageId) => {
    try {
      await api.markMessageAsRead(messageId);
      setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: true } : m));
    } catch (e) {
      console.error("Failed to mark message as read", e);
    }
  };

  useEffect(() => {
    let interval;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
        fetchMessages();
        fetchContacts();
        fetchSuperAdminAlerts();
        interval = setInterval(() => {
          fetchMessages();
          fetchSuperAdminAlerts();
        }, 15000);
      } else {
        navigate('/login');
      }
    });
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/super_admin/flag`, {
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

    const fetchSuperAdminAlerts = async () => {
    try {
      const res = await api.getSuperAdminReports();
      setSuperAdminAlerts(res.reports || []);
    } catch (e) {
      console.error("Failed to fetch super admin alerts", e);
    }
  };

  const handleReplyToSuperAdminAlert = async (alertId) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      await api.replyToReportSuperAdmin(alertId, replyText);
      setReplyText('');
      setReplyFormAlertId(null);
      fetchSuperAdminAlerts();
    } catch (e) {
      console.error("Failed to reply", e);
      alert("Failed to reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportForm.organization_id) {
      setReportMsg('Please select an organization.');
      return;
    }
    setIsSendingReport(true);
    setReportMsg('Sending...');
    try {
      await api.sendSuperAdminReport({
        ...reportForm,
        organization_id: parseInt(reportForm.organization_id)
      });
      setReportMsg('Report sent successfully!');
      setTimeout(() => {
        setShowReportModal(false);
        setReportMsg('');
        setReportForm({
          ...reportForm,
          subject: '',
          message: ''
        });
      }, 1500);
    } catch (err) {
      setReportMsg('Failed to send report.');
    } finally {
      setIsSendingReport(false);
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
      
      {/* VIEW ALERTS MODAL */}
      {showViewAlertsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }}></div>
            
            <button onClick={() => setShowViewAlertsModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>✖</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(to right, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>Sent Alerts Vault</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Communication History</p>
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="custom-scrollbar">
              {superAdminAlerts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '1.1rem' }}>No alerts broadcasted yet.</span>
                </div>
              ) : (
                superAdminAlerts.map(a => (
                  <div key={a.id} style={{ flexShrink: 0, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s', position: 'relative' }}>
                    
                    <div style={{ padding: '1.5rem', borderBottom: a.replies && JSON.parse(a.replies).length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          </div>
                          <div>
                            <h3 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 'bold' }}>{a.subject}</h3>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Target: ORG-{1000 + a.organization_id}</span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>•</span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(a.created_at * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                        {a.priority && (
                          <span style={{ background: a.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: a.priority === 'High' ? '#fca5a5' : '#fcd34d', border: `1px solid ${a.priority === 'High' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {a.priority}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
                        {a.message}
                      </div>
                    </div>

                    {/* THREADED REPLIES */}
                    {a.replies && JSON.parse(a.replies).length > 0 && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          Communication Thread
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {JSON.parse(a.replies).map((reply, idx) => {
                            const isSuperAdmin = reply.sender === 'SUPER_ADMIN';
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isSuperAdmin ? 'flex-end' : 'flex-start' }}>
                                <div style={{ 
                                  maxWidth: '85%', 
                                  background: isSuperAdmin ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))' : 'rgba(255,255,255,0.03)', 
                                  border: isSuperAdmin ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)', 
                                  padding: '1rem 1.25rem', 
                                  borderRadius: isSuperAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isSuperAdmin ? '#93c5fd' : '#cbd5e1' }}>
                                      {isSuperAdmin ? 'Super Admin (You)' : `Organization (ORG-${1000 + a.organization_id})`}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(reply.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <div style={{ fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.5 }}>{reply.content}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                      {replyFormAlertId === a.id ? (
                        <div style={{ width: '100%', display: 'flex', gap: '0.75rem' }}>
                          <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type a secure response..." style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }} onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'} />
                          <button onClick={() => handleReplyToSuperAdminAlert(a.id)} disabled={isReplying} style={{ padding: '0 1.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            {isReplying ? '...' : 'Send'}
                          </button>
                          <button onClick={() => setReplyFormAlertId(null)} style={{ padding: '0 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontWeight: 'bold', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setReplyFormAlertId(a.id)} style={{ padding: '0.5rem 1.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontWeight: 'bold', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"></polyline><path d="M4 20v-7a4 4 0 0 1 4-4h12"></path></svg>
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ width: '100%', maxWidth: '650px', padding: '2.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)' }}></div>
            
            <button onClick={() => setShowReportModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>✖</button>
            
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(to right, #60A5FA, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>Global Alert Broadcast</h2>
            
            {reportMsg && (
              <div style={{ background: reportMsg.includes('success') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '12px', color: reportMsg.includes('success') ? '#6EE7B7' : '#FCA5A5', marginBottom: '1.5rem', fontSize: '0.95rem', border: `1px solid ${reportMsg.includes('success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={reportMsg.includes('success') ? "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3" : "M18 6L6 18 M6 6l12 12"}></path></svg>
                {reportMsg}
              </div>
            )}
            
            <form onSubmit={handleSendReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Target Organization</label>
                <select style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2360A5FA\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em', outline: 'none', transition: 'all 0.3s' }} value={reportForm.organization_id} onChange={(e) => setReportForm({...reportForm, organization_id: e.target.value})} required onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                  <option value="" style={{ background: '#0f172a' }}>-- Select Organization --</option>
                  {approvedOrgs.map(org => (
                    <option key={org.id} value={org.id} style={{ background: '#0f172a' }}>{org.name} (ID: ORG-{1000+org.id})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Report Type</label>
                  <select style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2360A5FA\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em', outline: 'none', transition: 'all 0.3s' }} value={reportForm.report_type} onChange={(e) => setReportForm({...reportForm, report_type: e.target.value})} required onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                    <option value="Notification" style={{ background: '#0f172a' }}>General Notification</option>
                    <option value="Flood Warning" style={{ background: '#0f172a' }}>Flood Warning</option>
                    <option value="SOS" style={{ background: '#0f172a' }}>SOS Alert</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Priority Level</label>
                  <select style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)', borderLeft: reportForm.priority === 'High' ? '4px solid #ef4444' : reportForm.priority === 'Medium' ? '4px solid #f59e0b' : '4px solid #3b82f6', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2360A5FA\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em', outline: 'none', transition: 'all 0.3s' }} value={reportForm.priority} onChange={(e) => setReportForm({...reportForm, priority: e.target.value})} required onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                    <option value="Low" style={{ background: '#0f172a' }}>Low</option>
                    <option value="Medium" style={{ background: '#0f172a' }}>Medium</option>
                    <option value="High" style={{ background: '#0f172a' }}>High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Subject</label>
                <input type="text" style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', transition: 'all 0.3s' }} value={reportForm.subject} onChange={(e) => setReportForm({...reportForm, subject: e.target.value})} required placeholder="Enter brief subject..." onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Message Content</label>
                <textarea style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', resize: 'vertical' }} rows="5" value={reportForm.message} onChange={(e) => setReportForm({...reportForm, message: e.target.value})} required placeholder="Type the detailed message here..." onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}></textarea>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Notifications automatically vanish from the organization's inbox after 1 hour of inactivity.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowReportModal(false)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontWeight: 'bold', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Cancel</button>
                <button type="submit" disabled={isSendingReport} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: '#fff', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {isSendingReport ? 'Transmitting...' : 'Broadcast Alert 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MESSAGES INBOX MODAL */}
      {showMessagesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399, #3b82f6)' }}></div>
            
            <button onClick={() => setShowMessagesModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>✖</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(to right, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>Secure Comms</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Direct Messaging Interface</p>
              </div>
              <button onClick={() => setShowComposeModal(true)} style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Compose
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="custom-scrollbar">
              {messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '1.1rem' }}>No direct messages yet.</span>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{ flexShrink: 0, background: m.is_read ? 'rgba(15, 23, 42, 0.4)' : 'rgba(16, 185, 129, 0.05)', border: m.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.5rem', transition: 'all 0.3s', boxShadow: m.is_read ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.1)', position: 'relative', overflow: 'hidden' }}>
                    {!m.is_read && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {m.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem 0', color: m.is_read ? '#cbd5e1' : '#f8fafc', fontSize: '1.1rem' }}>{m.subject}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '500' }}>From: {m.sender_name}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        {new Date(m.created_at * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div style={{ color: m.is_read ? '#94a3b8' : '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', paddingLeft: '44px', marginLeft: '1rem' }}>
                      {m.content}
                    </div>
                    {!m.is_read && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button onClick={() => handleMarkMessageRead(m.id)} style={{ padding: '0.5rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: 'bold', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Acknowledge
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE MESSAGE MODAL */}
      {showComposeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ width: '100%', maxWidth: '550px', padding: '2.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)' }}></div>
            
            <button onClick={() => setShowComposeModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>✖</button>
            
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(to right, #10B981, #6EE7B7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '1px' }}>New Transmission</h2>
            
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Destination Node</label>
                <select style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2310B981\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em', outline: 'none', transition: 'all 0.3s' }} value={messageForm.receiver_uid} onChange={(e) => setMessageForm({...messageForm, receiver_uid: e.target.value})} required onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}>
                  <option value="" style={{ background: '#0f172a' }}>-- Select Recipient --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Subject Protocol</label>
                <input type="text" style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', transition: 'all 0.3s' }} value={messageForm.subject} onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})} required placeholder="Enter brief subject..." onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Payload Data</label>
                <textarea style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#f1f5f9', fontSize: '1rem', outline: 'none', transition: 'all 0.3s', resize: 'vertical' }} rows="4" value={messageForm.content} onChange={(e) => setMessageForm({...messageForm, content: e.target.value})} required placeholder="Type the message..." onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.3)'} onBlur={(e) => e.target.style.boxShadow = 'none'}></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowComposeModal(false)} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontWeight: 'bold', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Abort</button>
                <button type="submit" disabled={isSendingMessage} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {isSendingMessage ? 'Transmitting...' : 'Send Message 📡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', marginBottom: '2rem' }}>
        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '900', 
            margin: 0, 
            background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #c084fc 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(165, 180, 252, 0.3)',
            letterSpacing: '1px'
          }}>
            SUPER ADMIN
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '0.2rem' }}>
            Central Command Center
          </p>
        </div>

        {/* Right Side - Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => fetchData()} 
            className="btn-futuristic"
            style={{ 
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1', 
              padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s',
              opacity: isRefreshing ? 0.7 : 1, cursor: isRefreshing ? 'wait' : 'pointer'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            {isRefreshing ? 'Syncing...' : 'Sync'}
          </button>

          <button 
            onClick={() => setShowMessagesModal(true)}
            style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', color: '#34d399', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 'bold', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Comms
            {unreadMessagesCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', minWidth: '22px', height: '22px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px #0f172a, 0 0 10px #10b981', padding: '0 4px' }}>
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => { fetchSuperAdminAlerts(); setShowViewAlertsModal(true); }}
            style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.5)', color: '#60a5fa', padding: '0.6rem 1.2rem', fontWeight: 'bold', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Alerts
          </button>

          <button 
            onClick={() => setShowReportModal(true)} 
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', padding: '0.6rem 1.2rem', fontWeight: 'bold', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Broadcast
          </button>

          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>

          <button 
            onClick={handleLogout} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; }}
            title="Logout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* FUTURISTIC TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
          { id: 'organizations', label: 'Organizations', badge: orgs.length, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
          { id: 'users', label: 'Global Users', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
          { id: 'testing', label: 'Testing', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 9.36l-7.1 7.1a1 1 0 0 1-1.41-1.41l7.1-7.1a6 6 0 0 1 9.36-7.94l-3.77 3.77a1 1 0 0 0 0 1.41z' },
          { id: 'analytics', label: 'AI Analytics', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent', 
              border: activeTab === tab.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent', 
              fontSize: '0.95rem', 
              fontWeight: activeTab === tab.id ? 'bold' : '500', 
              color: activeTab === tab.id ? '#c7d2fe' : '#94a3b8', 
              cursor: 'pointer', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '12px',
              whiteSpace: 'nowrap', 
              transition: 'all 0.3s',
              boxShadow: activeTab === tab.id ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none'
            }}
            onMouseOver={(e) => { 
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseOut={(e) => { 
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: activeTab === tab.id ? 1 : 0.7 }}>
              <path d={tab.icon}></path>
            </svg>
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ 
                background: '#EF4444', 
                color: '#fff', 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                minWidth: '20px', 
                height: '20px', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0 6px',
                marginLeft: '0.25rem',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
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

      {/* ANALYTICS TAB CONTENT */}
      {activeTab === 'analytics' && (
        <AnalyticsPanel zones={globalZones} />
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
          <h2 style={{ margin: 0, color: '#60A5FA' }}>Organization Alerts</h2>
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
