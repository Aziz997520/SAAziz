import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
  },
};

export const offers = {
  getAll: () => api.get('/offers'),
  getById: (id) => api.get(`/offers/${id}`),
  create: (offerData) => api.post('/offers', offerData),
  update: (id, offerData) => api.put(`/offers/${id}`, offerData),
  delete: (id) => api.delete(`/offers/${id}`),
};

export const profile = {
  get: (userId) => api.get(`/profile/${userId}`),
  update: (userId, profileData) => {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (key === 'profileImage' && profileData[key] instanceof File) {
        formData.append('profileImage', profileData[key]);
      } else {
        formData.append(key, profileData[key]);
      }
    });
    return api.put(`/profile/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPortfolio: (userId, images) => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    return api.post(`/profile/${userId}/portfolio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const messages = {
  send: (messageData) => api.post('/messages', messageData),
  getByUser: (userId) => api.get(`/messages/${userId}`),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
};

export const feed = {
  create: (feedData) => {
    const formData = new FormData();
    if (feedData.image) {
      formData.append('image', feedData.image);
    }
    formData.append('content', feedData.content);
    formData.append('userId', feedData.userId);
    return api.post('/feed', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/feed'),
};

export const applications = {
  create: (offerId, message) => api.post(`/offers/${offerId}/apply`, { message }),
  getByUser: () => api.get('/applications'),
  getByOffer: (offerId) => api.get(`/offers/${offerId}/applications`),
};

export default {
  auth,
  offers,
  profile,
  applications,
  messages,
  feed,
}; 