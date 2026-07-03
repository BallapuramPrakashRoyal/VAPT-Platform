import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const listScans = () => api.get('/scans').then((r) => r.data);
export const getScan = (id) => api.get(`/scans/${id}`).then((r) => r.data);
export const createScan = (payload) => api.post('/scans', payload).then((r) => r.data);
export const deleteScan = (id) => api.delete(`/scans/${id}`).then((r) => r.data);

export default api;
