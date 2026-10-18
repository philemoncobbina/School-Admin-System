// # my-project/src/Services/SignUpService.ts

import axios from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

interface SignUpData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'staff' | 'principal';
}

// Function to sign up a user.
// Credentials travel in HttpOnly cookies and the CSRF header is added by the
// interceptors installed in initAuth(), so no auth headers are built here.
export const signUpUser = async (data: SignUpData) => {
  try {
    const response = await axios.post(`${API_URL}signup-auth/`, data);
    return response;
  } catch (error) {
    throw error;
  }
};