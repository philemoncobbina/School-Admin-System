// # my-project/src/Services/jobPostService.ts

import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

export interface JobPost {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  created_by: number;
  created_by_email: string;
  created_at: string;
  reference_number: string;
  applications_count: number;
  updated_at: string;
  scheduled_date: string | null;
  published_date: string | null;
}

export interface CreateJobPostDTO {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
}

export interface ScheduleJobPostDTO {
  scheduled_date: string;
}

export interface JobPostLog {
  id: number;
  job_post: number;
  user: number | null;
  user_email: string;
  changed_fields: string;
  timestamp: string;
  action_type: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'PUBLISH' | 'SCHEDULE';
}

// Same URL as before (http://localhost:8000/api/api/...), now built from API_URL.
// Always ends with a slash.
const BASE = `${API_URL}api/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.

// JobPostService with API methods
export const JobPostService = {
  // Get all job posts
  getAllPosts: async (): Promise<JobPost[]> => {
    const response: AxiosResponse<JobPost[]> = await axios.get(`${BASE}jobposts/`);
    return response.data;
  },

  // Get a single job post by ID
  getPostById: async (id: number): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.get(`${BASE}jobposts/${id}/`);
    return response.data;
  },

  // Create a new job post
  createPost: async (post: CreateJobPostDTO): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.post(`${BASE}jobposts/`, post);
    return response.data;
  },

  // Update an existing job post
  updatePost: async (id: number, post: Partial<JobPost>): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.patch(`${BASE}jobposts/${id}/`, post);
    return response.data;
  },

  // Delete a job post
  deletePost: async (id: number): Promise<void> => {
    await axios.delete(`${BASE}jobposts/${id}/`);
  },

  // Publish a job post
  publishPost: async (id: number): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.post(`${BASE}jobposts/${id}/publish/`, {});
    return response.data;
  },

  // Schedule a job post
  schedulePost: async (id: number, scheduleData: ScheduleJobPostDTO): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.post(
      `${BASE}jobposts/${id}/schedule/`,
      scheduleData
    );
    return response.data;
  },

  // Get draft posts
  getDraftPosts: async (): Promise<JobPost[]> => {
    const response: AxiosResponse<JobPost[]> = await axios.get(`${BASE}jobposts/get_draft_posts/`);
    return response.data;
  },

  // Get scheduled posts
  getScheduledPosts: async (): Promise<JobPost[]> => {
    const response: AxiosResponse<JobPost[]> = await axios.get(`${BASE}jobposts/get_scheduled_posts/`);
    return response.data;
  },

  // Get published posts
  getPublishedPosts: async (): Promise<JobPost[]> => {
    const response: AxiosResponse<JobPost[]> = await axios.get(`${BASE}jobposts/get_published_posts/`);
    return response.data;
  },

  // Get logs for a specific job post
  getJobPostLogs: async (jobPostId: number): Promise<JobPostLog[]> => {
    const response: AxiosResponse<JobPostLog[]> = await axios.get(`${BASE}jobposts/${jobPostId}/logs/`);
    return response.data;
  },

  // Update the application count for a job post
  updateApplicationCount: async (id: number): Promise<JobPost> => {
    const response: AxiosResponse<JobPost> = await axios.post(
      `${BASE}jobposts/${id}/update_application_count/`,
      {}
    );
    return response.data;
  },
};

// JobPostLogService with API methods specific to logs
export const JobPostLogService = {
  // Get all logs for a specific job post
  getLogsForJobPost: async (jobPostId: number): Promise<JobPostLog[]> => {
    const response: AxiosResponse<JobPostLog[]> = await axios.get(`${BASE}jobposts/${jobPostId}/logs/`);
    return response.data;
  },

  // Get all logs (if an endpoint exists for this)
  getAllLogs: async (): Promise<JobPostLog[]> => {
    const response: AxiosResponse<JobPostLog[]> = await axios.get(`${BASE}jobpost-logs/`);
    return response.data;
  },

  // Filter logs by action type
  getLogsByActionType: async (actionType: JobPostLog['action_type']): Promise<JobPostLog[]> => {
    const response: AxiosResponse<JobPostLog[]> = await axios.get(`${BASE}jobpost-logs/`, {
      params: { action_type: actionType },
    });
    return response.data;
  },

  // Filter logs by user
  getLogsByUser: async (userId: number): Promise<JobPostLog[]> => {
    const response: AxiosResponse<JobPostLog[]> = await axios.get(`${BASE}jobpost-logs/`, {
      params: { user: userId },
    });
    return response.data;
  },
};