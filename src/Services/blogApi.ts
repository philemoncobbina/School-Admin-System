// services/blogApi.js
import axios from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same base as before (http://localhost:8000/api), built from the shared API_URL.
// Always ends with a slash.
const POSTS_URL = `${API_URL}posts/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.
//
// Reads are public, so they pass skipAuthRedirect: a visitor who isn't signed in
// (or has a stale cookie) must not be sent to /login just for reading the blog.

export const blogApi = {
  // Blog Posts
  getAllBlogs: (params = {}) =>
    axios.get(POSTS_URL, { params, skipAuthRedirect: true }),

  getBlogBySlug: (slug) =>
    axios.get(`${POSTS_URL}${slug}/`, { skipAuthRedirect: true }),

  createBlog: (data) =>
    axios.post(POSTS_URL, data),

  updateBlog: (slug, data) =>
    axios.put(`${POSTS_URL}${slug}/`, data),

  deleteBlog: (slug) =>
    axios.delete(`${POSTS_URL}${slug}/`),

  // Helper function to create blog post with JSON data (alias for createBlog)
  createBlogWithJSON: (data) =>
    axios.post(POSTS_URL, data),

  // Helper function to create blog post with FormData.
  // Axios sets the multipart Content-Type and boundary itself.
  createBlogWithFormData: (formData) =>
    axios.post(POSTS_URL, formData),
};