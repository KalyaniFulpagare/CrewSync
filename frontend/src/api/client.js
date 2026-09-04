import axios from 'axios';
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
const client = axios.create({ baseURL: apiBaseUrl });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('crewsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default client;
