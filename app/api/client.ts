import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://localhost:3000/api',
});

export default apiClient;