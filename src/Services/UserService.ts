import axios, { AxiosResponse } from 'axios';

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }
  return { Authorization: `Bearer ${accessToken}` };
};

// User service class for handling authenticated user data requests
class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://127.0.0.1:8000/api'; // Replace with your backend URL
  }

  // Method to fetch user details
  public async getUserDetails(): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/user-detail-auth/`, {
        headers: getAuthHeaders(),
      });
      return response.data; // User details returned from the backend
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      if (error.response) {
        throw new Error(error.response.data?.detail || 'Failed to fetch user details');
      }
      throw new Error('Failed to connect to the server');
    }
  }

  // Generic method to make authenticated requests (GET, POST, etc.)
  public async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<any> {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: getAuthHeaders(),
        data,
      };
      const response: AxiosResponse = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error(`Error in ${method} request to ${endpoint}:`, error);
      if (error.response) {
        throw new Error(error.response.data?.detail || 'Request failed');
      }
      throw new Error('Failed to connect to the server');
    }
  }
}

export default new UserService();

