import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const apiService = {
  // Logs
  getLogs: (filters = {}) => api.get('/api/logs', { params: filters }),
  createLog: (data) => api.post('/api/logs', data),
  uploadLog: (formData) => api.post('/api/logs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteLog: (id) => api.delete(`/api/logs/${id}`),
  markAsRead: (id) => api.patch(`/api/logs/${id}/read`),

  // Stats
  getStats: () => api.get('/api/stats'),
  getTimeline: (days = 7) => api.get('/api/stats/timeline', { params: { days } }),

  // Alerts
  sendAlert: (data) => api.post('/api/alerts/send', data),
  testEmail: (email) => api.post('/api/alerts/test', { email }),

  // Settings
  getSettings: () => api.get('/api/settings'),
  updateSettings: (data) => api.post('/api/settings/update', data)
};

export default apiService;
