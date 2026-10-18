import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Pulls the most useful message out of a failed response.
const errorMessage = (error: any, fallback: string): string => {
  if (error?.response) {
    const data = error.response.data;
    return data?.detail || data?.error || fallback;
  }
  return 'Failed to connect to the server';
};

// User service for authenticated requests.
// Credentials travel in HttpOnly cookies and the CSRF header is added by the interceptors
// installed in initAuth(), so nothing here builds auth headers.
class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL; // always ends with a slash
  }

  private url(endpoint: string): string {
    return `${this.baseUrl}${endpoint.replace(/^\/+/, '')}`;
  }

  // Method to fetch user details
  public async getUserDetails(): Promise<any> {
    try {
      const response: AxiosResponse = await axios.get(this.url('user-detail-auth/'));
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      throw new Error(errorMessage(error, 'Failed to fetch user details'));
    }
  }

  // Generic method to make authenticated requests (GET, POST, etc.)
  public async makeAuthenticatedRequest(
    endpoint: string,
    method: HttpMethod,
    data?: any
  ): Promise<any> {
    try {
      const response: AxiosResponse = await axios({
        method,
        url: this.url(endpoint),
        data,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error in ${method} request to ${endpoint}:`, error);
      throw new Error(errorMessage(error, 'Request failed'));
    }
  }
}

export default new UserService();