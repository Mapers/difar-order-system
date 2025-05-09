import axios from 'axios';

const apiClient = axios.create({
  // baseURL: 'https://3qavkuqp3f.us-west-2.awsapprunner.com/api',
  baseURL: 'http://localhost:4000/api'
});

export default apiClient;
