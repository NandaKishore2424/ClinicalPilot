import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const sendMessage = async (message, image, conversationId) => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    if (image) {
      formData.append('image', image);
    }
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const response = await api.post('/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (error.response) {
      const msg = error.response.data?.message || error.response.data?.error || 'Server error';
      throw new Error(`${msg} (status ${error.response.status})`);
    } else if (error.request) {
      throw new Error('Network error - no response received');
    } else {
      throw new Error('Error sending request: ' + error.message);
    }
  }
};

export const getConversationHistory = async (conversationId) => {
  const response = await api.get(`/history/${conversationId}`);
  return response.data;
};

export const getAllConversations = async () => {
  const response = await api.get('/history');
  return response.data;
};

export const renameConversation = async (conversationId, title) => {
  const response = await api.patch(`/history/${conversationId}/rename`, { title });
  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/history/${conversationId}`);
  return response.data;
};

export default api;