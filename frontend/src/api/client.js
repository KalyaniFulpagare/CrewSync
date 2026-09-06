import axios from 'axios';
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
const client = axios.create({ baseURL: apiBaseUrl });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('crewsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    window.dispatchEvent(new CustomEvent('api-error', { detail: message }));
    return Promise.reject(error);
  }
);
export default client;
