import axios from 'axios';

const API = axios.create({
  // Prefer using CRA proxy with "/api" to avoid CORS in development
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 10000,
});

// Request interceptor để tự động thêm token
API.interceptors.request.use(
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

// Response interceptor để xử lý lỗi
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  verify: () => API.get('/auth/verify'),
};

// Books APIs
export const booksAPI = {
  getAll: (params = {}) => API.get('/books', { params }),
  getById: (id) => API.get(`/books/${id}`),
  create: (bookData) => API.post('/books', bookData),
  createMultipart: (formData) => API.post('/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, bookData) => API.put(`/books/${id}`, bookData),
  updateMultipart: (id, formData) => API.put(`/books/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/books/${id}`),
  getStatsOverview: () => API.get('/books/stats/overview'),
  // onUploadProgress: optional callback function(progressEvent)
  // params: optional object => passed as query params (e.g., { bookId })
  uploadCover: (formData, onUploadProgress, params = {}) => API.post('/books/upload', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    params
  }),
  deleteCover: (filename) => API.delete(`/books/upload/${filename}`),
  getContentUrl: (id) => `${API.defaults.baseURL}/books/${id}/content`,
};

// Borrows APIs
export const borrowsAPI = {
  borrow: (data) => API.post('/borrows', data),
  returnBook: (id) => API.post(`/borrows/${id}/return`),
  myBorrows: () => API.get('/borrows/my'),
  getAll: (params = {}) => API.get('/borrows', { params }),
  updateOverdue: () => API.patch('/borrows/overdue'),
};

// Users APIs (Admin only)
export const usersAPI = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post('/users', userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  delete: (id) => API.delete(`/users/${id}`),
  getProfile: () => API.get('/users/profile/me'),
  getStats: () => API.get('/users/stats'),
  getInternalCode: () => API.get('/users/internal-code'),
  updateInternalCode: (data) => API.put('/users/internal-code', data),
  getInternalCodeAudit: () => API.get('/users/internal-code/audit'),
};

// Favorites APIs
export const favoritesAPI = {
  my: () => API.get('/favorites/my'),
  check: (bookId) => API.get(`/favorites/check/${bookId}`),
  add: (bookId) => API.post('/favorites', { bookId }),
  remove: (bookId) => API.delete(`/favorites/${bookId}`),
};

export default API;
