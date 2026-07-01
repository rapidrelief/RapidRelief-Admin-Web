import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = {
  async registerOrg(data) {
    const res = await fetch(`${API_BASE_URL}/register_org`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  async getProfile(firebase_uid) {
    const res = await fetch(`${API_BASE_URL}/my_profile/${firebase_uid}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getPendingOrgs() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/pending_organizations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch orgs');
    return res.json();
  },

  async getApprovedOrgs() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/approved_organizations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch approved orgs');
    return res.json();
  },

  async approveOrg(org_id, super_admin_uid) {
    const res = await fetch(`${API_BASE_URL}/approve_organization`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: org_id, super_admin_uid })
    });
    return res.json();
  },

  async createRescuer(data) {
    const res = await fetch(`${API_BASE_URL}/create_rescuer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteUser(uid) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/user/${uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  async deleteOrg(orgId) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/organization/${orgId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete org');
    return res.json();
  },

  async getOrgRescuers(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/rescuers?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch rescuers');
    return res.json();
  },

  async deleteOrgRescuer(uid, adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/rescuer/${uid}?admin_uid=${adminUid}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error('Failed to delete rescuer');
    return res.json();
  },

  async getOrgZones(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/zones?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch zones');
    return res.json();
  },

  async createOrgZone(adminUid, zoneData) {
    const res = await fetch(`${API_BASE_URL}/org_admin/zone?firebase_uid=${adminUid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData)
    });
    if (!res.ok) throw new Error('Failed to create zone');
    return res.json();
  },

  async getOrgDevices(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/devices?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async createOrgDevice(adminUid, deviceData) {
    const res = await fetch(`${API_BASE_URL}/org_admin/device?firebase_uid=${adminUid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    if (!res.ok) throw new Error('Failed to create device');
    return res.json();
  },

  async getOrgNodes(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/nodes?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch nodes');
    return res.json();
  },

  async createOrgNode(adminUid, nodeData) {
    const res = await fetch(`${API_BASE_URL}/org_admin/node?firebase_uid=${adminUid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nodeData)
    });
    if (!res.ok) throw new Error('Failed to create node');
    return res.json();
  },

  async deleteOrgZone(uid, zoneId) {
    const res = await fetch(`${API_BASE_URL}/org_admin/zone/${zoneId}?firebase_uid=${uid}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete zone');
    return res.json();
  },

  async deleteOrgDevice(uid, deviceId) {
    const res = await fetch(`${API_BASE_URL}/org_admin/device/${deviceId}?firebase_uid=${uid}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete device');
    return res.json();
  },

  async deleteOrgNode(uid, nodeId) {
    const res = await fetch(`${API_BASE_URL}/org_admin/node/${nodeId}?firebase_uid=${uid}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete node');
    return res.json();
  },

  async getGlobalZones(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/global_zones?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch global zones');
    return res.json();
  },

  async getGlobalDevices(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/global_devices?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch global devices');
    return res.json();
  },

  async getOrgActiveSOS(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/active_sos?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch active SOS');
    return res.json();
  },

  async getOrgActiveFloods(adminUid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/active_floods?firebase_uid=${adminUid}`);
    if (!res.ok) throw new Error('Failed to fetch active floods');
    return res.json();
  },

  async completeSOS(sosId, data = {}) {
    const res = await fetch(`${API_BASE_URL}/api/sos/complete/${sosId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to complete SOS');
    return res.json();
  },

  async createSOS(data) {
    const res = await fetch(`${API_BASE_URL}/api/sos/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create SOS');
    return res.json();
  },

  async getGlobalActiveSOS() {
    const res = await fetch(`${API_BASE_URL}/api/sos/active`);
    if (!res.ok) throw new Error('Failed to fetch active SOS');
    return res.json();
  },

  async getGlobalSOSHistory() {
    const res = await fetch(`${API_BASE_URL}/api/sos/history`);
    if (!res.ok) throw new Error('Failed to fetch SOS history');
    return res.json();
  },

  async deleteSOS(id) {
    const res = await fetch(`${API_BASE_URL}/api/sos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error('Failed to delete SOS');
    return res.json();
  },

  async bulkDeleteSOS(ids) {
    const res = await fetch(`${API_BASE_URL}/api/sos/bulk_delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to bulk delete SOS');
    return res.json();
  },

  async getPrediction(zoneId, days = 7) {
    const res = await fetch(`${API_BASE_URL}/prediction/zone/${zoneId}?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch AI predictions');
    return res.json();
  },

  async sendSuperAdminReport(reportData) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/report`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) throw new Error('Failed to send report');
    return res.json();
  },

  async getOrgReports(firebase_uid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/reports?firebase_uid=${firebase_uid}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async markReportAsRead(reportId, firebase_uid) {
    const res = await fetch(`${API_BASE_URL}/org_admin/reports/${reportId}/read?firebase_uid=${firebase_uid}`, {
      method: "POST"
    });
    if (!res.ok) throw new Error('Failed to mark report as read');
    return res.json();
  },

  async replyToReportOrgAdmin(reportId, firebase_uid, content) {
    const res = await fetch(`${API_BASE_URL}/org_admin/reports/${reportId}/reply?firebase_uid=${firebase_uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to reply to report');
    return res.json();
  },

  async getSuperAdminReports() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch super admin reports');
    return res.json();
  },

  async replyToReportSuperAdmin(reportId, content) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/super_admin/reports/${reportId}/reply`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to reply to report');
    return res.json();
  },

  async getMessageContacts() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/messages/contacts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async sendMessage(data) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getInboxMessages() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/messages/inbox`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async markMessageAsRead(messageId) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
