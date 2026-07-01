import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { api } from '../api';
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { toast } from 'react-toastify';
import { useRef } from 'react';

// Create a custom icon for rescuers
const rescuerIcon = new L.divIcon({
  html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 5px rgba(0,0,0,0.4); border: 2px solid white;">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="3"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="12" y1="16" x2="8" y2="22"></line>
              <line x1="12" y1="16" x2="16" y2="22"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
         </div>`,
  className: 'rescuer-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

// Create a custom icon for SOS
const sosIcon = new L.divIcon({
  html: `<div style="background-color: #f87171; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(248,113,113,0.9); border: 2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
         </div>`,
  className: 'sos-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

function MapUpdater({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function OrgAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rescuers, setRescuers] = useState([]);
  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [globalZones, setGlobalZones] = useState([]);
  const [globalDevices, setGlobalDevices] = useState([]);
  const [activeSOSRaw, setActiveSOS] = useState([]);
  const [activeFloods, setActiveFloods] = useState([]);
  
  const activeSOS = activeSOSRaw.filter(s => s.source !== 'ZONE_FLOOD');
  
  const [mapCenter, setMapCenter] = useState([31.5204, 74.3587]);
  
  const [expandedZoneId, setExpandedZoneId] = useState(null);
  const [expandedGlobalZoneId, setExpandedGlobalZoneId] = useState(null);
  const [expandedRescuerId, setExpandedRescuerId] = useState(null);
  const [selectedMapRescuer, setSelectedMapRescuer] = useState(null);
  const [selectedMapZone, setSelectedMapZone] = useState(null);

  const [mapViewMode, setMapViewMode] = useState('org'); // 'org' or 'global'
  const [mapItemMode, setMapItemMode] = useState('zones'); // 'zones' or 'rescuers'

  // Users tab state
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [sosHistoryGlobal, setSosHistoryGlobal] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [orgName, setOrgName] = useState('My Organization');
  const [orgProfile, setOrgProfile] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const getSignalPill = (state) => {
    const map = {
      nosignal: { label: 'No Signal', bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' },
      lost: { label: 'Lost', bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' },
      online: { label: 'Online', bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399' },
      flood: { label: 'Flood Alert', bg: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' },
      sos: { label: 'SOS Emergency', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }
    };
    const s = map[state] || map.nosignal;
    return (
      <span style={{ background: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {s.label}
      </span>
    );
  };
  const [loading, setLoading] = useState(true);

  // New Rescuer Form State
  const [formData, setFormData] = useState({ rescuer_name: '', rescuer_email: '', rescuer_phone: '' });
  const [formMsg, setFormMsg] = useState('');

  // New Zone/Device State
  const [zoneForm, setZoneForm] = useState({ name: '', lat: '', lng: '', radius_m: '', priority: 'MEDIUM' });
  const [deviceForm, setDeviceForm] = useState({ device_id: '', zone_id: '' });
  const [nodeForm, setNodeForm] = useState({ node_id: '', gateway_id: '' });
  const [infraMsg, setInfraMsg] = useState('');
  
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [lastRegisteredGateway, setLastRegisteredGateway] = useState(null);
  const [lastRegisteredNode, setLastRegisteredNode] = useState(null);
  const [loraSecret, setLoraSecret] = useState(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const [selectedZoneForDevices, setSelectedZoneForDevices] = useState(null);

  // Reports Management
  const [reports, setReports] = useState([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const prevReportsRef = useRef([]);
  const unreadCount = reports.filter(r => !r.is_read).length;

  // Universal Messaging System State
  const [messages, setMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messageForm, setMessageForm] = useState({ receiver_uid: '', subject: '', content: '' });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const unreadMessagesCount = messages.filter(m => !m.is_read).length;

  const fetchReports = async (uid) => {
    try {
      const res = await api.getOrgReports(uid);
      if (res.status === 'success') {
        const newReports = res.reports;
        setReports(newReports);
        
        // Toast newly arrived unread reports
        const prevIds = new Set(prevReportsRef.current.map(r => r.id));
        newReports.forEach(r => {
          if (!r.is_read && !prevIds.has(r.id)) {
            toast.info(`New ${r.priority} Priority Report: ${r.subject}`, {
              icon: r.report_type === 'SOS' ? '🚨' : r.report_type === 'Flood Warning' ? '🌊' : '🔔'
            });
          }
        });
        prevReportsRef.current = newReports;
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    }
  };

  const handleMarkReportRead = async (reportId) => {
    try {
      await api.markReportAsRead(reportId, auth.currentUser.uid);
      setReports(reports.map(r => r.id === reportId ? { ...r, is_read: true } : r));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.getInboxMessages();
      const newMessages = res.messages || [];
      
      const oldUnread = messages.filter(m => !m.is_read).map(m => m.id);
      const newlyUnread = newMessages.filter(m => !m.is_read && !oldUnread.includes(m.id));
      
      if (newlyUnread.length > 0 && messages.length > 0) {
        toast.info(`You have ${newlyUnread.length} new message(s)!`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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
      toast.success("Message sent successfully!");
      setShowComposeModal(false);
      setMessageForm({ receiver_uid: '', subject: '', content: '' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
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
        fetchData(user);
        fetchReports(user.uid);
        fetchMessages();
        fetchContacts();
        interval = setInterval(() => {
          fetchReports(user.uid);
          fetchMessages();
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

  const fetchData = async (user = auth.currentUser) => {
    try {
      if (!user) return;
      setIsRefreshing(true);
      
      // Fetch each endpoint individually and catch errors so one failure doesn't break everything
      const fetchSafe = async (apiCall, fallback) => {
        try {
          return await apiCall;
        } catch (e) {
          console.error("Endpoint failed:", e);
          return fallback;
        }
      };

      const [resData, zoneData, deviceData, nodeData, sosData, floodData, globalZData, globalDData, historyData, usersSnapshot, profileData] = await Promise.all([
        fetchSafe(api.getOrgRescuers(user.uid), []),
        fetchSafe(api.getOrgZones(user.uid), []),
        fetchSafe(api.getOrgDevices(user.uid), []),
        fetchSafe(api.getOrgNodes(user.uid), []),
        fetchSafe(api.getOrgActiveSOS(user.uid), []),
        fetchSafe(api.getOrgActiveFloods(user.uid), []),
        fetchSafe(api.getGlobalZones(user.uid), []),
        fetchSafe(api.getGlobalDevices(user.uid), []),
        fetchSafe(api.getGlobalSOSHistory(), {sos: []}),
        fetchSafe(getDocs(collection(db, 'users')), {docs: []}),
        fetchSafe(api.getProfile(user.uid), null)
      ]);

      setRescuers(resData);
      setZones(zoneData);
      setDevices(deviceData);
      setNodes(nodeData);
      setActiveSOS(sosData);
      setActiveFloods(floodData);
      setGlobalZones(globalZData);
      setGlobalDevices(globalDData);
      setSosHistoryGlobal(historyData.sos || []);
      
      let foundProfile = false;
      const currentUserDoc = usersSnapshot.docs?.find(doc => doc.id === user.uid || doc.data().uid === user.uid);
      if (currentUserDoc) {
        const data = currentUserDoc.data();
        const profile = {
          organization_name: data.organization_name,
          organization_id: data.organization_id,
          admin_name: data.fullName,
          admin_email: data.email,
          admin_phone: data.phone
        };
        setOrgProfile(profile);
        if (data.organization_name) setOrgName(data.organization_name);
        foundProfile = true;
      }
      
      if (!foundProfile) {
        if (profileData) {
          setOrgProfile(profileData);
          if (profileData.organization_name) setOrgName(profileData.organization_name);
        } else if (zoneData.length > 0 && zoneData[0].organization_name) {
          setOrgName(zoneData[0].organization_name);
        }
      }
      
      const usersList = [];
      usersSnapshot.docs?.forEach(doc => {
        const data = doc.data();
        if (data.role === 'user') {
          usersList.push({ id: doc.id, ...data });
        }
      });
      setRegisteredUsers(usersList);
      
      if (zoneData.length > 0 && !selectedZoneForDevices) {
        setSelectedZoneForDevices(zoneData[0].id);
      }
    } catch (err) {
      console.error(err);
      setInfraMsg(`Error fetching data: ${err.message}. If you recently recreated your account, please try logging out and logging back in.`);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const getSosZoneName = (zoneId) => {
    if (!zoneId) return 'Global/Unassigned';
    let z = zones.find(z => z.id === zoneId);
    if (!z) z = globalZones.find(z => z.id === zoneId);
    return z ? z.name : `Zone ${zoneId}`;
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleCreateRescuer = async (e) => {
    e.preventDefault();
    setFormMsg('');
    try {
      const currentUser = auth.currentUser;
      const res = await api.createRescuer({
        admin_uid: currentUser.uid,
        ...formData
      });

      if (res.status === 'success') {
        // Send them a password reset email so they can log in
        try {
          await sendPasswordResetEmail(auth, formData.rescuer_email);
          setFormMsg('Rescuer created! A password setup email has been sent to them.');
        } catch (emailErr) {
          console.error(emailErr);
          setFormMsg('Rescuer created, but failed to send setup email.');
        }
        
        setFormData({ rescuer_name: '', rescuer_email: '', rescuer_phone: '' });
        fetchData();
      } else {
        setFormMsg(res.message || 'Failed to create rescuer');
      }
    } catch (err) {
      console.error(err);
      setFormMsg('Network error while creating rescuer.');
    }
  };

  const handleDeleteRescuer = async (uid) => {
    if (!window.confirm("Delete this rescuer permanently?")) return;
    try {
      await api.deleteOrgRescuer(uid, auth.currentUser.uid);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete rescuer");
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      await api.createOrgZone(auth.currentUser.uid, {
        name: zoneForm.name,
        lat: parseFloat(zoneForm.lat),
        lng: parseFloat(zoneForm.lng),
        radius_m: parseFloat(zoneForm.radius_m),
        priority: zoneForm.priority
      });
      setInfraMsg('Zone created successfully!');
      setZoneForm({ name: '', lat: '', lng: '', radius_m: '', priority: 'MEDIUM' });
      fetchData();
    } catch (err) {
      setInfraMsg('Failed to create zone.');
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    try {
      const randomApiKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const res = await api.createOrgDevice(auth.currentUser.uid, {
        device_id: parseInt(deviceForm.device_id),
        api_key: randomApiKey,
        zone_id: parseInt(deviceForm.zone_id)
      });
      setInfraMsg('Gateway registered successfully!');
      setLastRegisteredGateway({ id: deviceForm.device_id, api_key: randomApiKey });
      setShowGatewayModal(true);
      setDeviceForm({ device_id: '', zone_id: '' });
      fetchData();
    } catch (err) {
      setInfraMsg('Failed to register gateway.');
    }
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createOrgNode(auth.currentUser.uid, {
        node_id: parseInt(nodeForm.node_id),
        gateway_id: parseInt(nodeForm.gateway_id)
      });
      setInfraMsg('Node registered successfully!');
      setLastRegisteredNode({ id: nodeForm.node_id, gateway_id: nodeForm.gateway_id });
      setShowNodeModal(true);
      setNodeForm({ node_id: '', gateway_id: '' });
      fetchData();
    } catch (err) {
      setInfraMsg('Failed to register node.');
    }
  };
  const handleDeleteZone = async (id) => {
    if (!window.confirm("Delete this zone and ALL its associated gateways and nodes permanently?")) return;
    try {
      await api.deleteOrgZone(auth.currentUser.uid, id);
      if (selectedZoneForDevices === id) setSelectedZoneForDevices(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete zone");
    }
  };

  const handleDeleteGateway = async (deviceId) => {
    if (!window.confirm("Delete this gateway and ALL its attached nodes permanently?")) return;
    try {
      await api.deleteOrgDevice(auth.currentUser.uid, deviceId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete gateway");
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm("Delete this node permanently?")) return;
    try {
      await api.deleteOrgNode(auth.currentUser.uid, nodeId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete node");
    }
  };

  return (
    <div className="page-container">
      {/* REPORTS INBOX MODAL */}
      {showReportsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', border: '1px solid rgba(59, 130, 246, 0.5)', position: 'relative' }}>
            <button onClick={() => setShowReportsModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <h2 style={{ marginBottom: '0.5rem', color: '#60A5FA' }}>Super Admin Messages</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
              Note: Messages older than 1 hour will automatically vanish.
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }} className="custom-scrollbar">
              {reports.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No messages in your inbox.</div>
              ) : (
                reports.map(r => (
                  <div key={r.id} style={{ background: r.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(59, 130, 246, 0.1)', border: r.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!r.is_read && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>}
                        <h3 style={{ margin: 0, color: r.is_read ? '#cbd5e1' : '#fff' }}>{r.subject}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.created_at * 1000).toLocaleString()}</span>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', border: `1px solid ${r.priority === 'High' ? '#ef4444' : r.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}`, color: r.priority === 'High' ? '#ef4444' : r.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                          {r.priority}
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {r.report_type}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: r.is_read ? 'var(--text-muted)' : '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                      {r.message}
                    </div>
                    {!r.is_read && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleMarkReportRead(r.id)} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          Mark as Read
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

      {/* MESSAGES INBOX MODAL */}
      {showMessagesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.5)', position: 'relative' }}>
            <button onClick={() => setShowMessagesModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#34D399' }}>Direct Messages</h2>
              <button onClick={() => setShowComposeModal(true)} className="btn-primary" style={{ background: '#10B981', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                + Compose Message
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }} className="custom-scrollbar">
              {messages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No messages in your inbox.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} style={{ background: m.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(16, 185, 129, 0.1)', border: m.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {!m.is_read && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>}
                        <div>
                          <h3 style={{ margin: 0, color: m.is_read ? '#cbd5e1' : '#fff' }}>{m.subject}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#10b981' }}>From: {m.sender_name}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(m.created_at * 1000).toLocaleString()}</span>
                    </div>
                    <div style={{ color: m.is_read ? 'var(--text-muted)' : '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '1rem', marginTop: '0.5rem' }}>
                      {m.content}
                    </div>
                    {!m.is_read && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleMarkMessageRead(m.id)} className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          Mark as Read
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.5)', position: 'relative' }}>
            <button onClick={() => setShowComposeModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <h2 style={{ marginBottom: '1.5rem', color: '#34D399' }}>Compose Message</h2>
            <form onSubmit={handleSendMessage}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Recipient</label>
                <select className="input-field" value={messageForm.receiver_uid} onChange={(e) => setMessageForm({...messageForm, receiver_uid: e.target.value})} required>
                  <option value="">Select Recipient...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Subject</label>
                <input type="text" className="input-field" value={messageForm.subject} onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Message</label>
                <textarea className="input-field" rows="4" value={messageForm.content} onChange={(e) => setMessageForm({...messageForm, content: e.target.value})} required></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowComposeModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSendingMessage} style={{ background: '#10b981' }}>
                  {isSendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="header">
        <div>
          <h1 className="title">Organization Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage Rescuers, Zones, and Sensors</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* MESSAGES BUTTON */}
            <button 
              onClick={() => setShowMessagesModal(true)}
              style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', marginRight: '0.5rem' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {unreadMessagesCount > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #0f172a' }}>
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>
            {/* NOTIFICATION BELL */}
            <button 
              onClick={() => setShowReportsModal(true)}
              style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', marginRight: '0.5rem' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {reports.filter(r => !r.is_read).length > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #0f172a' }}>
                  {reports.filter(r => !r.is_read).length}
                </span>
              )}
            </button>

            <button className="btn-primary" onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}>
              Logout
            </button>
            <button className="btn-primary" onClick={() => fetchData()} disabled={isRefreshing} style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#bae6fd', opacity: isRefreshing ? 0.7 : 1, cursor: isRefreshing ? 'wait' : 'pointer' }}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ color: '#a5b4fc', fontWeight: 'bold', fontSize: '1.1rem' }}>{orgName}</span>
            <button onClick={() => setShowSettingsModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Organization Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'dashboard' ? '#a5b4fc' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal' }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('rescuers')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'rescuers' ? '#a5b4fc' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', fontWeight: activeTab === 'rescuers' ? 'bold' : 'normal' }}
        >
          Rescuer Personnel
        </button>
        <button 
          onClick={() => setActiveTab('infrastructure')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'infrastructure' ? '#a5b4fc' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', fontWeight: activeTab === 'infrastructure' ? 'bold' : 'normal' }}
        >
          Infrastructure (IoT)
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'users' ? '#a5b4fc' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', fontWeight: activeTab === 'users' ? 'bold' : 'normal' }}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'analytics' ? '#a5b4fc' : 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', fontWeight: activeTab === 'analytics' ? 'bold' : 'normal' }}
        >
          AI Analytics
        </button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Row: General Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Total Rescuers</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#a5b4fc' }}>
                {loading ? '-' : rescuers.length}
              </div>
            </div>
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Active Zones</h3>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#a5b4fc' }}>
                {loading ? '-' : zones.length}
              </div>
            </div>
          </div>

          {/* Second Row: Live Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Active SOS Card */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '300px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', boxShadow: '0 0 10px #f87171' }}></span>
                Active SOS Alerts
              </h3>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }} className="custom-scrollbar">
                {activeSOS.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No active SOS emergencies.</div>
                ) : (
                  activeSOS.map(sos => (
                    <div key={sos.id} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{sos.source === 'USER' ? 'User Emergency' : 'Rescuer Broadcast'}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getSignalPill('sos')}
                          <button 
                            onClick={async () => {
                              if (window.confirm("Clear this SOS request?")) {
                                try {
                                  await api.completeSOS(sos.id, { completed_by_name: 'Web Admin' });
                                  fetchData();
                                } catch (e) {
                                  alert("Failed to clear SOS");
                                }
                              }
                            }}
                            title="Clear SOS"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '1.2rem', padding: '0 0.3rem' }}
                          >
                            ✖
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                        <div><strong>Zone:</strong> {getSosZoneName(sos.zone_id)}</div>
                        {sos.user_name && <div><strong>User:</strong> {sos.user_name} ({sos.user_phone})</div>}
                        {sos.rescuer_name && <div><strong>Reported by:</strong> {sos.rescuer_name}</div>}
                        {sos.lat && sos.lng && (
                          <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                            Location: {Number(sos.lat).toFixed(5)}, {Number(sos.lng).toFixed(5)}
                          </div>
                        )}
                      </div>
                      {sos.lat && sos.lng && (
                        <button 
                          onClick={() => setMapCenter([Number(sos.lat), Number(sos.lng)])}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: 'rgba(248, 113, 113, 0.2)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Locate on Map
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Floods Card */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', maxHeight: '300px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }}></span>
                Active Flood Zones
              </h3>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }} className="custom-scrollbar">
                {activeFloods.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No active flood warnings.</div>
                ) : (
                  activeFloods.map(flood => (
                    <div key={flood.zone_id} style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{flood.zone_name}</strong>
                        {getSignalPill('flood')}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                        Active sensing devices reporting: {flood.active_devices}
                      </div>
                      <button 
                        onClick={() => setMapCenter([flood.lat, flood.lng])}
                        style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: 'rgba(56,189,248,0.2)', color: '#bae6fd', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Locate on Map
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP DASHBOARD PANEL */}
      {activeTab === 'dashboard' && !loading && (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Live Tracking Map</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setMapViewMode('org')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mapViewMode === 'org' ? '#3b82f6' : 'transparent', color: mapViewMode === 'org' ? '#fff' : '#cbd5e1', cursor: 'pointer', fontWeight: mapViewMode === 'org' ? 'bold' : 'normal' }}>
                  My Organization
                </button>
                <button 
                  onClick={() => setMapViewMode('global')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mapViewMode === 'global' ? '#f59e0b' : 'transparent', color: mapViewMode === 'global' ? '#fff' : '#cbd5e1', cursor: 'pointer', fontWeight: mapViewMode === 'global' ? 'bold' : 'normal' }}>
                  Global View
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setMapItemMode('zones')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mapItemMode === 'zones' ? '#10b981' : 'transparent', color: mapItemMode === 'zones' ? '#fff' : '#cbd5e1', cursor: 'pointer', fontWeight: mapItemMode === 'zones' ? 'bold' : 'normal' }}>
                  Zones
                </button>
                <button 
                  onClick={() => setMapItemMode('rescuers')}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: mapItemMode === 'rescuers' ? '#ef4444' : 'transparent', color: mapItemMode === 'rescuers' ? '#fff' : '#cbd5e1', cursor: 'pointer', fontWeight: mapItemMode === 'rescuers' ? 'bold' : 'normal' }}>
                  Rescuers
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <MapContainer center={[31.5204, 74.3587]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <MapUpdater center={mapCenter} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              
              {mapItemMode === 'zones' && mapViewMode === 'org' && zones.map(zone => (
                <Circle 
                  key={zone.id} 
                  center={[zone.lat, zone.lng]} 
                  radius={zone.radius_m}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                  eventHandlers={{ click: () => { setSelectedMapZone(zone); setSelectedMapRescuer(null); } }}
                >
                  <Popup>
                    <strong>{zone.name}</strong><br/>
                    Priority: {zone.priority}
                  </Popup>
                </Circle>
              ))}

              {mapItemMode === 'zones' && mapViewMode === 'global' && globalZones.map(zone => (
                <Circle 
                  key={zone.id} 
                  center={[zone.lat, zone.lng]} 
                  radius={zone.radius_m}
                  pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2 }}
                  eventHandlers={{ click: () => { setSelectedMapZone(zone); setSelectedMapRescuer(null); } }}
                >
                  <Popup>
                    <strong>{zone.name}</strong><br/>
                    Org: {zone.organization_name}<br/>
                    Priority: {zone.priority}
                  </Popup>
                </Circle>
              ))}
              
              {mapItemMode === 'rescuers' && rescuers.map(r => {
                // If rescuer has no live coordinates, place them randomly near the center for demonstration
                const rLat = r.lat || mapCenter[0] + (Math.random() - 0.5) * 0.05;
                const rLng = r.lng || mapCenter[1] + (Math.random() - 0.5) * 0.05;
                return (
                  <Marker 
                    key={r.id} 
                    position={[rLat, rLng]} 
                    icon={rescuerIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedMapRescuer(r);
                        setSelectedMapZone(null);
                      },
                    }}
                  >
                    <Popup>
                      <strong>{r.name}</strong><br/>
                      {r.status || 'Online'}
                    </Popup>
                  </Marker>
                );
              })}

              {/* ALWAYS SHOW ACTIVE SOS MARKERS */}
              {activeSOS.map(sos => {
                if (sos.lat && sos.lng) {
                  return (
                    <Marker
                      key={sos.id}
                      position={[Number(sos.lat), Number(sos.lng)]}
                      icon={sosIcon}
                    >
                      <Popup>
                        <strong style={{color: '#ef4444'}}>SOS Emergency!</strong><br/>
                        <strong>User:</strong> {sos.user_name || sos.rescuer_name || 'Unknown'}<br/>
                        <strong>Zone:</strong> {getSosZoneName(sos.zone_id)}
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>

          {selectedMapRescuer && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', display: 'flex', gap: '2rem', animation: 'fadeIn 0.3s ease-in-out', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Rescuer</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{selectedMapRescuer.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact</div>
                <div style={{ fontSize: '1rem', color: '#fff' }}>{selectedMapRescuer.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: '1rem', color: '#fff' }}>{selectedMapRescuer.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: '1rem', color: selectedMapRescuer.status === 'Offline' ? '#f87171' : '#34d399' }}>{selectedMapRescuer.status || 'Online'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button 
                  onClick={() => setSelectedMapRescuer(null)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {selectedMapZone && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', display: 'flex', gap: '2rem', animation: 'fadeIn 0.3s ease-in-out', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Zone</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{selectedMapZone.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority</div>
                <div style={{ fontSize: '1rem', color: selectedMapZone.priority === 'HIGH' ? '#fca5a5' : '#fff' }}>{selectedMapZone.priority}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Radius</div>
                <div style={{ fontSize: '1rem', color: '#fff' }}>{selectedMapZone.radius_m} meters</div>
              </div>
              {selectedMapZone.organization_name && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Organization</div>
                  <div style={{ fontSize: '1rem', color: '#a5b4fc', fontWeight: 'bold' }}>{selectedMapZone.organization_name}</div>
                </div>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <button 
                  onClick={() => setSelectedMapZone(null)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Quick Jump</h4>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
              
              {mapItemMode === 'zones' && mapViewMode === 'org' && zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => { setMapCenter([zone.lat, zone.lng]); setSelectedMapZone(zone); setSelectedMapRescuer(null); }}
                  style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(59, 130, 246, 0.5)', background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                >
                  {zone.name}
                </button>
              ))}

              {mapItemMode === 'zones' && mapViewMode === 'global' && globalZones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => { setMapCenter([zone.lat, zone.lng]); setSelectedMapZone(zone); setSelectedMapRescuer(null); }}
                  style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                >
                  {zone.name} (Global)
                </button>
              ))}

              {mapItemMode === 'rescuers' && rescuers.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setMapCenter([r.lat || mapCenter[0], r.lng || mapCenter[1]]); setSelectedMapRescuer(r); setSelectedMapZone(null); }}
                  style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                >
                  {r.name}
                </button>
              ))}

              {mapItemMode === 'zones' && mapViewMode === 'org' && zones.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.4rem 0' }}>No zones found.</div>}
              {mapItemMode === 'zones' && mapViewMode === 'global' && globalZones.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.4rem 0' }}>No global zones found.</div>}
              {mapItemMode === 'rescuers' && rescuers.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.4rem 0' }}>No rescuers found.</div>}
            </div>
          </div>
        </div>
      )}

      {/* RESCUERS TAB */}
      {activeTab === 'rescuers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Create Rescuer Form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Rescuer</h2>
            {formMsg && (
              <div style={{ background: formMsg.includes('created') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '8px', color: formMsg.includes('created') ? '#6ee7b7' : '#fca5a5', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {formMsg}
              </div>
            )}
            <form onSubmit={handleCreateRescuer}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label className="label" style={{ color: '#cbd5e1' }}>Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.rescuer_name}
                  onChange={(e) => setFormData({...formData, rescuer_name: e.target.value})}
                  required 
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div style={{ marginBottom: '1.2rem' }}>
                <label className="label" style={{ color: '#cbd5e1' }}>Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.rescuer_email}
                  onChange={(e) => setFormData({...formData, rescuer_email: e.target.value})}
                  required 
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label" style={{ color: '#cbd5e1' }}>Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.rescuer_phone}
                  onChange={(e) => setFormData({...formData, rescuer_phone: e.target.value})}
                  required 
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Create Rescuer Account
              </button>
            </form>
          </div>

          {/* Rescuers Table */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Registered Personnel</h2>
            {rescuers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                No rescuers have been added yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0' }}>Name</th>
                      <th style={{ padding: '1rem 0' }}>Email</th>
                      <th style={{ padding: '1rem 0' }}>Phone</th>
                      <th style={{ padding: '1rem 0' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rescuers.map(r => {
                      const isExpanded = expandedRescuerId === r.id;
                      return (
                        <React.Fragment key={r.id}>
                          <tr 
                            onClick={() => setExpandedRescuerId(isExpanded ? null : r.id)}
                            style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                          >
                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>{r.name}</td>
                            <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{r.email}</td>
                            <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{r.phone}</td>
                            <td style={{ padding: '1rem 0' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteRescuer(r.firebase_uid); }}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                              <td colSpan="4" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Rescuer ID</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{r.rescuer_id}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Status</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: r.status === 'Online' ? '#34d399' : (r.status === 'Offline' ? '#f87171' : '#fbbf24') }}>{r.status}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>CNIC</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{r.cnic || 'N/A'}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Address</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{r.address || 'N/A'}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Emergency Contact</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{r.emergency || 'N/A'}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INFRASTRUCTURE TAB */}
      {activeTab === 'infrastructure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {infraMsg && (
            <div style={{ background: infraMsg.includes('success') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: '8px', color: infraMsg.includes('success') ? '#6ee7b7' : '#fca5a5', textAlign: 'center' }}>
              {infraMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Create Zone Form */}
              <div className="glass-panel">
                <h2 style={{ marginBottom: '1.5rem' }}>Create Deployment Zone</h2>
                <form onSubmit={handleCreateZone}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label" style={{ color: '#cbd5e1' }}>Zone Name</label>
                    <input type="text" className="input-field" value={zoneForm.name} onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="label" style={{ color: '#cbd5e1' }}>Latitude</label>
                      <input type="number" step="any" className="input-field" value={zoneForm.lat} onChange={(e) => setZoneForm({...zoneForm, lat: e.target.value})} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                    <div>
                      <label className="label" style={{ color: '#cbd5e1' }}>Longitude</label>
                      <input type="number" step="any" className="input-field" value={zoneForm.lng} onChange={(e) => setZoneForm({...zoneForm, lng: e.target.value})} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="label" style={{ color: '#cbd5e1' }}>Radius (meters)</label>
                      <input type="number" className="input-field" value={zoneForm.radius_m} onChange={(e) => setZoneForm({...zoneForm, radius_m: e.target.value})} required style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                    </div>
                    <div>
                      <label className="label" style={{ color: '#cbd5e1' }}>Priority</label>
                      <select className="input-field" value={zoneForm.priority} onChange={(e) => setZoneForm({...zoneForm, priority: e.target.value})} style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Zone</button>
                </form>
              </div>

              {/* Devices in Zone Panel */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                <h2 style={{ marginBottom: '1rem' }}>Devices in Zone</h2>
                
                {/* Horizontal Scroll Zones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="custom-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem', flex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {zones.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>No zones available.</span>
                    ) : (
                      zones.map(z => (
                        <button 
                          key={z.id}
                          onClick={() => setSelectedZoneForDevices(z.id)}
                          style={{
                            whiteSpace: 'nowrap',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: selectedZoneForDevices === z.id ? '#a5b4fc' : 'rgba(255,255,255,0.2)',
                            background: selectedZoneForDevices === z.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            color: selectedZoneForDevices === z.id ? '#fff' : '#cbd5e1',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {z.name}
                        </button>
                      ))
                    )}
                  </div>
                  {selectedZoneForDevices && (
                    <button 
                      onClick={() => handleDeleteZone(selectedZoneForDevices)}
                      style={{ marginLeft: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #fca5a5', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="Delete this Zone and all its devices"
                    >
                      Delete Zone
                    </button>
                  )}
                </div>

                {/* Device List */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                  {!selectedZoneForDevices ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Select a zone to view devices.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {devices.filter(d => d.zone_id === selectedZoneForDevices).length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No gateways registered in this zone.</div>
                      ) : (
                        devices.filter(d => d.zone_id === selectedZoneForDevices).map(gateway => {
                          const gwNodes = nodes.filter(n => n.gateway_id === gateway.device_id);
                          return (
                            <div key={gateway.device_id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden' }}>
                              {/* Gateway Header */}
                              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1.2rem' }}>📡</span>
                                  <strong style={{ color: '#38bdf8' }}>Gateway #{gateway.device_id}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  {!gateway.last_seen ? <span style={{ color: '#fca5a5', fontSize: '0.8rem', background: 'rgba(239,68,68,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Not Assigned</span> : gateway.is_lost ? <span style={{ color: '#fca5a5', fontSize: '0.8rem', background: 'rgba(239,68,68,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Lost</span> : <span style={{ color: '#6ee7b7', fontSize: '0.8rem', background: 'rgba(16,185,129,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Online</span>}
                                  {gateway.sos && <span style={{ color: '#fff', fontSize: '0.8rem', background: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>SOS</span>}
                                  <button onClick={() => handleDeleteGateway(gateway.device_id)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem' }} title="Delete Gateway">🗑️</button>
                                </div>
                              </div>
                              {/* Nodes List */}
                              <div style={{ padding: '0.8rem 1rem' }}>
                                {gwNodes.length === 0 ? (
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No nodes attached to this gateway.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {gwNodes.map(node => (
                                      <div key={node.node_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ fontSize: '1rem' }}>📍</span>
                                          <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Node #{node.node_id}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                          {!node.last_seen ? <span style={{ color: '#fca5a5', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)' }}>Not Assigned</span> : node.is_lost ? <span style={{ color: '#fca5a5', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)' }}>Lost</span> : <span style={{ color: '#6ee7b7', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>Online</span>}
                                          {node.flood && <span style={{ color: '#fff', fontSize: '0.7rem', background: '#3b82f6', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Flood</span>}
                                          {node.sos && <span style={{ color: '#fff', fontSize: '0.7rem', background: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>SOS</span>}
                                          <button onClick={() => handleDeleteNode(node.node_id)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', marginLeft: '0.2rem' }} title="Delete Node">✖</button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Register Gateway Form */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Register Gateway</h2>
                <button onClick={() => setShowGatewayModal(true)} style={{ background: 'transparent', border: '1px solid rgba(56, 189, 248, 0.5)', color: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>How to Deploy Gateway?</button>
              </div>
              <form onSubmit={handleCreateDevice}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label" style={{ color: '#cbd5e1' }}>Gateway ID</label>
                  <input type="number" className="input-field" value={deviceForm.device_id} onChange={(e) => setDeviceForm({...deviceForm, device_id: e.target.value})} required placeholder="Enter a numeric ID (e.g., 22)" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label" style={{ color: '#cbd5e1' }}>Assign to Zone</label>
                  <select className="input-field" value={deviceForm.zone_id} onChange={(e) => setDeviceForm({...deviceForm, zone_id: e.target.value})} required style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                    <option value="">Select a Zone...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>Register Gateway</button>
              </form>

              {/* Register Node Form */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' }}>
                <h2 style={{ margin: 0 }}>Register LoRa Node</h2>
                <button onClick={() => setShowNodeModal(true)} style={{ background: 'transparent', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>How to Deploy Node?</button>
              </div>
              <form onSubmit={handleCreateNode}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label" style={{ color: '#cbd5e1' }}>Node ID</label>
                  <input type="number" className="input-field" value={nodeForm.node_id} onChange={(e) => setNodeForm({...nodeForm, node_id: e.target.value})} required placeholder="Enter a numeric ID (e.g., 101)" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="label" style={{ color: '#cbd5e1' }}>Assign to Gateway</label>
                  <select className="input-field" value={nodeForm.gateway_id} onChange={(e) => setNodeForm({...nodeForm, gateway_id: e.target.value})} required style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                    <option value="">Select a Gateway...</option>
                    {devices.map(d => (
                      <option key={d.device_id} value={d.device_id}>Gateway #{d.device_id} (Zone {d.zone_id})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>Register Node</button>
              </form>
            </div>
            
          </div>

          {/* Zones Table */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Your Organization's Deployed Infrastructure</h2>
            {zones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                No zones created.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0' }}>Zone ID</th>
                      <th style={{ padding: '1rem 0' }}>Name</th>
                      <th style={{ padding: '1rem 0' }}>Priority</th>
                      <th style={{ padding: '1rem 0' }}>Status</th>
                      <th style={{ padding: '1rem 0' }}>Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map(z => {
                      const isExpanded = expandedZoneId === z.id;
                      const stats = z.stats || { total_devices: 0, total_gateways: 0, total_nodes: 0, active_devices: 0, signal_state: 'nosignal' };
                      return (
                        <React.Fragment key={z.id}>
                          <tr 
                            onClick={() => setExpandedZoneId(isExpanded ? null : z.id)} 
                            style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                          >
                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>#{z.id}</td>
                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>{z.name}</td>
                            <td style={{ padding: '1rem 0', color: z.priority === 'HIGH' ? '#fca5a5' : 'var(--text-muted)' }}>{z.priority}</td>
                            <td style={{ padding: '1rem 0' }}>{getSignalPill(stats.signal_state)}</td>
                            <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{z.lat.toFixed(4)}, {z.lng.toFixed(4)}</td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                              <td colSpan="5" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Devices</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_devices}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Gateways</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_gateways}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Nodes</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_nodes}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Active Devices</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stats.active_devices > 0 ? '#34d399' : '#f87171' }}>{stats.active_devices}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Radius</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{z.radius_m}m</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Global Zones Table */}
          <div className="glass-panel" style={{ marginTop: '1rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Global Infrastructure Overview</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              This table shows all active zones across all organizations, including legacy deployments.
            </p>
            {globalZones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                No global zones found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem 0' }}>Zone ID</th>
                      <th style={{ padding: '1rem 0' }}>Name</th>
                      <th style={{ padding: '1rem 0' }}>Priority</th>
                      <th style={{ padding: '1rem 0' }}>Organization Owner</th>
                      <th style={{ padding: '1rem 0' }}>Status</th>
                      <th style={{ padding: '1rem 0' }}>Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalZones.map(z => {
                      const isExpanded = expandedGlobalZoneId === z.id;
                      const stats = z.stats || { total_devices: 0, total_gateways: 0, total_nodes: 0, active_devices: 0, signal_state: 'nosignal' };
                      return (
                        <React.Fragment key={z.id}>
                          <tr 
                            onClick={() => setExpandedGlobalZoneId(isExpanded ? null : z.id)} 
                            style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                          >
                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>#{z.id}</td>
                            <td style={{ padding: '1rem 0', fontWeight: '500' }}>{z.name}</td>
                            <td style={{ padding: '1rem 0', color: z.priority === 'HIGH' ? '#fca5a5' : 'var(--text-muted)' }}>{z.priority}</td>
                            <td style={{ padding: '1rem 0', color: '#a5b4fc', fontWeight: 'bold' }}>{z.organization_name}</td>
                            <td style={{ padding: '1rem 0' }}>{getSignalPill(stats.signal_state)}</td>
                            <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{z.lat.toFixed(4)}, {z.lng.toFixed(4)}</td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                              <td colSpan="6" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Devices</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_devices}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Gateways</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_gateways}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Nodes</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.total_nodes}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Active Devices</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: stats.active_devices > 0 ? '#34d399' : '#f87171' }}>{stats.active_devices}</div>
                                  </div>
                                  <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Radius</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{z.radius_m}m</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* GATEWAY MODAL */}
      {showGatewayModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(56, 189, 248, 0.4)', position: 'relative' }}>
            <button onClick={() => setShowGatewayModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <h2 style={{ color: '#38bdf8', marginBottom: '1rem' }}>Deploying a Gateway</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Gateways act as the central hub for a Zone. They listen for LoRa signals from Nodes and forward them to the backend server via WiFi.
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Step 1: Configure `secrets.h`</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>Open your Gateway Arduino sketch and modify the `secrets.h` file with these exact values:</p>
              
              <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', color: '#38bdf8', overflowX: 'auto' }}>
{`#pragma once

const char* WIFI_SSID = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

const int GATEWAY_DEVICE_ID = ${lastRegisteredGateway ? lastRegisteredGateway.id : '<YOUR_GATEWAY_ID>'};
const char* GATEWAY_API_KEY = "${lastRegisteredGateway ? lastRegisteredGateway.api_key : '<YOUR_API_KEY>'}";
const char* BACKEND_SERVER = "https://rapidrelief-backend-wnf8.onrender.com";

const char* LORA_NODE_SECRET = "${loraSecret}";`}
              </pre>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Step 2: Upload to ESP32</h3>
              <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li>Connect your Gateway ESP32 to your computer.</li>
                <li>Select the correct COM port in Arduino IDE.</li>
                <li>Click <strong>Upload</strong>.</li>
                <li>Once complete, open the Serial Monitor (115200 baud) to verify it connects to WiFi and starts listening on LoRa.</li>
              </ul>
            </div>
            
            <button onClick={() => setShowGatewayModal(false)} className="btn-primary" style={{ width: '100%', marginTop: '2rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>I've copied these details</button>
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
              Users Detail <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>({registeredUsers.length} Total)</span>
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
                  {registeredUsers.length === 0 ? 'No registered users found.' : 'No users match your search.'}
                </div>
              );
            }
            
            return filteredUsers.map(u => {
              const allUserSos = [
                ...activeSOS.map(sos => ({ ...sos, isActive: true })),
                ...sosHistoryGlobal.map(sos => ({ ...sos, isActive: false }))
              ].filter(sos => sos.user_id === u.id || sos.user_name === u.fullName)
              .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

               const isExpanded = expandedUserId === u.id;
              // Determine their zone if possible, based on their latest SOS
              const latestSos = allUserSos.length > 0 ? allUserSos[0] : null;
              const userZone = latestSos ? getSosZoneName(latestSos.zone_id) : 'Global / Unassigned';
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
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Zone</div>
                        <div style={{ fontSize: '1.1rem', color: '#a5b4fc' }}>{userZone}</div>
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
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>SOS History Log</h4>
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
                              const d = Math.floor(diffSeconds / 86400);
                              const h = Math.floor((diffSeconds % 86400) / 3600);
                              const m = Math.floor((diffSeconds % 3600) / 60);
                              const s = Math.floor(diffSeconds % 60);
                              
                              const parts = [];
                              if (d > 0) parts.push(`${d}d`);
                              if (h > 0) parts.push(`${h}h`);
                              if (m > 0) parts.push(`${m}m`);
                              parts.push(`${s}s`);
                              durationStr = parts.join(' ');
                            }
                            
                            return (
                              <div key={sos.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${sos.isActive ? '#EF4444' : '#10B981'}` }}>
                                <div>
                                  {sos.isActive ? (
                                    <div style={{ fontWeight: 'bold', color: '#EF4444', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }}></span>
                                      LIVE SOS EMERGENCY
                                    </div>
                                  ) : (
                                    <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '0.2rem' }}>
                                      Resolved by {sos.completed_by_name === 'Web Admin' ? `Web Admin (${orgName})` : (sos.completed_by_name || 'Admin')}
                                    </div>
                                  )}
                                  
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Location: {Number(sos.lat).toFixed(4)}, {Number(sos.lng).toFixed(4)}</div>
                                  
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span><strong>Start:</strong> {startDate}</span>
                                    {!sos.isActive && <span><strong>End:</strong> {endDate}</span>}
                                    {!sos.isActive && <span><strong>Duration:</strong> {durationStr}</span>}
                                  </div>
                                </div>
                                
                                {sos.isActive && (
                                  <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                                    ACTIVE NOW
                                  </div>
                                )}
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

      {/* NODE MODAL */}
      {showNodeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(16, 185, 129, 0.4)', position: 'relative' }}>
            <button onClick={() => setShowNodeModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <h2 style={{ color: '#34d399', marginBottom: '1rem' }}>Deploying a LoRa Node</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Nodes are placed in the field. They read sensor data (Flood/SOS) and broadcast it via LoRa. They do not need WiFi.
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Step 1: Configure `secrets.h`</h3>
              <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>Open your Node Arduino sketch and modify the `secrets.h` file. <strong style={{ color: '#fca5a5' }}>Ensure the LORA_NODE_SECRET matches the Gateway!</strong></p>
              
              <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', color: '#34d399', overflowX: 'auto' }}>
{`#pragma once

const int NODE_DEVICE_ID = ${lastRegisteredNode ? lastRegisteredNode.id : '<YOUR_NODE_ID>'};
const char* LORA_NODE_SECRET = "${loraSecret}";`}
              </pre>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Step 2: Upload to ESP32</h3>
              <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li>Connect your Node ESP32 to your computer.</li>
                <li>Select the correct COM port in Arduino IDE.</li>
                <li>Click <strong>Upload</strong>.</li>
                <li>Once complete, press the SOS button or submerge the water sensor to test!</li>
              </ul>
            </div>
            
            <button onClick={() => setShowNodeModal(false)} className="btn-primary" style={{ width: '100%', marginTop: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>I've copied these details</button>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <AnalyticsPanel zones={zones} />
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', border: '1px solid var(--glass-border)', position: 'relative' }}>
            <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>Organization Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Organization Name</div>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{orgProfile?.organization_name || orgName || 'N/A'}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Organization ID</div>
                <div style={{ fontSize: '1.1rem', color: '#a5b4fc', fontFamily: 'monospace' }}>{orgProfile?.organization_id || orgProfile?.id || 'Pending / Not Set'}</div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
              
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Admin Name</div>
                <div style={{ fontSize: '1.1rem', color: '#fff' }}>{orgProfile?.admin_name || 'N/A'}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Admin Email</div>
                <div style={{ fontSize: '1.1rem', color: '#fff' }}>{orgProfile?.admin_email || orgProfile?.email || 'N/A'}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Admin Phone</div>
                <div style={{ fontSize: '1.1rem', color: '#fff' }}>{orgProfile?.admin_phone || orgProfile?.phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
