import api from './api';

// =============================================================================
// Dashboard Service
// =============================================================================

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data.dashboard;
  },
};

export const positionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/positions', { params });
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/positions/${id}`);
    return response.data;
  },
};

export const accountService = {
  getAll: async () => {
    const response = await api.get('/accounts');
    return response.data;
  },

  create: async (account) => {
    const response = await api.post('/accounts', account);
    return response.data;
  },

  update: async (id, updates) => {
    const response = await api.patch(`/accounts/${id}`, updates);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },
};

export const importService = {
  getImporters: async () => {
    const response = await api.get('/import/importers');
    return response.data.importers;
  },

  upload: async (file, importerId, accountId = null, syncMode = false) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('importerId', importerId);
  if (accountId) formData.append('accountId', accountId);
  formData.append('syncMode', String(syncMode));  // add this line

  const response = await api.post('/import/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
},

  getHistory: async () => {
    const response = await api.get('/import/history');
    return response.data;
  },
};

export const priceService = {
  refresh: async () => {
    const response = await api.post('/prices/refresh');
    return response.data;
  },
};

export const watchlistService = {
  getAll: async () => {
    const response = await api.get('/watchlist');
    return response.data;
  },

  add: async (ticker, assetName, assetType, notes, addedFrom = 'manual') => {
    const response = await api.post('/watchlist', {
      ticker, assetName, assetType, notes, addedFrom
    });
    return response.data;
  },

  update: async (ticker, notes) => {
    const response = await api.patch(`/watchlist/${ticker}`, { notes });
    return response.data;
  },

  remove: async (ticker) => {
    const response = await api.delete(`/watchlist/${ticker}`);
    return response.data;
  },
};
