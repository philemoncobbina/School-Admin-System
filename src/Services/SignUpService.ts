import axios from 'axios';

const API_URL = 'https://api.plvcmonline.uk/api/'; // Replace with your API endpoint

interface SignUpData {
    email: string;
    username: string;
    password: string;
    first_name: string;  // Added first_name
    last_name: string;   // Added last_name
    role: 'staff' | 'principal'; // Role
}

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

// Function to sign up a user
export const signUpUser = async (data: SignUpData) => {
  try {
    const response = await axios.post(`${API_URL}signup-auth/`, data, {
      headers: getAuthHeaders(),
    });
    return response;
  } catch (error) {
    throw error;
  }
};
