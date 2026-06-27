// services/blogApi.js
import axios from 'axios';

const API_BASE_URL = 'https://api.cobbina.uk/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const blogApi = {
  // Blog Posts
  getAllBlogs: (params = {}) => 
    axiosInstance.get('/posts/', { params }),
  
  getBlogBySlug: (slug) => 
    axiosInstance.get(`/posts/${slug}/`),
  
  createBlog: (data) => 
    axiosInstance.post('/posts/', data),
  
  updateBlog: (slug, data) => 
    axiosInstance.put(`/posts/${slug}/`, data),
  
  deleteBlog: (slug) => 
    axiosInstance.delete(`/posts/${slug}/`),
  
  // Helper function to create blog post with JSON data (alias for createBlog)
  createBlogWithJSON: (data) => 
    axiosInstance.post('/posts/', data),
  
  // Helper function to create blog post with FormData
  createBlogWithFormData: (formData) => {
    // For FormData, remove the Content-Type header to let browser set it with boundary
    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    };
    return axiosInstance.post('/posts/', formData, config);
  }
};