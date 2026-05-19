import api from './api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  inviteUser: async (email, role) => {
    const response = await api.post('/admin/invite', { email, role });
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/admin/users/${id}`, { role });
    return response.data;
  },

  getRoleRequests: async () => {
    const response = await api.get('/admin/role-requests');
    return response.data;
  },

  reviewRoleRequest: async (id, action) => {
    const response = await api.patch(`/admin/role-requests/${id}`, { action });
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await api.get('/admin/notification-settings');
    return response.data;
  },

  updateNotificationSettings: async (settings) => {
    const response = await api.patch('/admin/notification-settings', settings);
    return response.data;
  },

  testNotification: async (channel) => {
    const response = await api.post('/admin/notification-settings/test', { channel });
    return response.data;
  },
  deleteUser: async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
},
};

export const sharesService = {
  getShares: async () => {
    const response = await api.get('/shares');
    return response.data;
  },

  createShare: async (viewerEmail, label) => {
    const response = await api.post('/shares', { viewerEmail, label });
    return response.data;
  },

  deleteShare: async (id) => {
    const response = await api.delete(`/shares/${id}`);
    return response.data;
  },

  getSharedDashboard: async (ownerId) => {
    const response = await api.get(`/shares/${ownerId}/dashboard`);
    return response.data;
  },
};

export const userService = {
  requestUpgrade: async (message) => {
    const response = await api.post('/user/request-upgrade', { message });
    return response.data;
  },

  getUpgradeRequest: async () => {
    const response = await api.get('/user/upgrade-request');
    return response.data;
  },
};
