import axios, { AxiosResponse } from 'axios';

// Base URL for API requests
const API_URL = 'http://127.0.0.1:8000/api/';

// Types
export interface StudentUser {
  id?: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  index_number: string;
  class_name: string;
  role?: string;
}

export interface StudentLoginCredentials {
  email?: string;
  index_number?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: StudentUser;
}

export interface BatchCreateStudentResponse {
  message: string;
  created_students: StudentUser[];
  errors: any[];
}

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }
  return { Authorization: `Bearer ${accessToken}` };
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Student Auth Service
const studentAuthService = {
  // Create a single student account
  createStudent: async (studentData: StudentUser & { password: string }): Promise<AxiosResponse> => {
    return await api.post('student-signup/', studentData);
  },

  // Batch create multiple student accounts
  batchCreateStudents: async (studentsData: (StudentUser & { password: string })[]): Promise<BatchCreateStudentResponse> => {
    try {
      const headers = getAuthHeaders();
      const response = await api.post('batch-create/', { students: studentsData }, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login student using email/index number and password
  login: async (credentials: StudentLoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('login/', credentials);
    
    // Save tokens to localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Logout - clear stored tokens and user data
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userData');
  },

  // Get current user data from localStorage
  getCurrentUser: (): StudentUser | null => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  },

  // Check if user is logged in
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Check if the current user is a student
  isStudent: (): boolean => {
    const user = studentAuthService.getCurrentUser();
    return user?.role === 'student';
  },

  // Get class options based on your model's CLASS_CHOICES
  getClassOptions: () => [
  { value: 'Creche', label: 'Creche' },
  { value: 'Nursery', label: 'Nursery' },
  { value: 'KG 1', label: 'KG 1' },
  { value: 'KG 2', label: 'KG 2' },
  { value: 'Class 1', label: 'Class 1' },
  { value: 'Class 2', label: 'Class 2' },
  { value: 'Class 3', label: 'Class 3' },
  { value: 'Class 4', label: 'Class 4' },
  { value: 'Class 5', label: 'Class 5' },
  { value: 'Class 6', label: 'Class 6' },
  { value: 'JHS 1', label: 'JHS 1' },
  { value: 'JHS 2', label: 'JHS 2' },
  { value: 'JHS 3', label: 'JHS 3' },
],

  // Example of a protected API call using getAuthHeaders
  getProtectedData: async (): Promise<any> => {
    try {
      const headers = getAuthHeaders();
      const response = await api.get('protected-endpoint/', { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default studentAuthService;