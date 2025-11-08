import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// Helper function to get authorization headers
export const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

// Function to check if the user is logged in (synchronous)
export const isLoggedInSync = (): boolean => {
  return !!localStorage.getItem('access_token');
};

// Function to check if the user is logged in (asynchronous)
export const isLoggedIn = async (): Promise<{ loggedIn: boolean; user?: { id: number; email: string; role: string } }> => {
  try {
    const response = await axios.get(`${API_URL}session-check/`, {
      headers: getAuthHeaders(),
    });
    const { authenticated, user } = response.data;
    if (authenticated) {
      return { loggedIn: true, user };
    }
  } catch (error) {
    console.error('Session check failed:', error);
  }
  return { loggedIn: false };
};

// Function to log in the user
export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}login-auth/`, { email, password });
    const { access_token, user } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));

    console.log('User logged in successfully.');

    // Start session and idle timers
    startTestSessionTimer();
    startIdleTimer();

    return { success: true };
  } catch (error: any) {
    let errorMessage = 'An unknown error occurred';
    if (error.response && error.response.data) {
      errorMessage = error.response.data.error;
    }
    return { success: false, error: errorMessage };
  }
};

// Function to log out the user
export const logout = async (): Promise<void> => {
  try {
    // Call the backend logout endpoint
    await axios.post(`${API_URL}logout-auth/`, {}, {
      headers: getAuthHeaders(),
    });
    console.log('User logged out successfully.');

    // Redirect to the login page
    window.location.href = '/login';

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLogged');
    localStorage.removeItem('loginTime');
    console.log('Local storage cleared.');

    
  } catch (error) {
    console.error('Failed to log out:', error);
  }
};

// Helper function to start a test session timer (4 hours)
export const startTestSessionTimer = () => {
  setTimeout(async () => {
    // Check if the user is still logged in before logging out
    if (isLoggedInSync()) {
      await logout();
      console.log('Session timeout: User logged out after 4 hours.');
    } else {
      console.log('Session timeout: User is already logged out.');
    }
  }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
};


// Helper function to start an idle timer (40 seconds)
export const startIdleTimer = () => {
  let idleTimeout: NodeJS.Timeout;

  const resetIdleTimer = () => {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(async () => {
      // Check if the user is still logged in before logging out
      if (isLoggedInSync()) {
        await logout();
        console.log('Idle timeout: User logged out after 40 seconds of inactivity.');
      } else {
        console.log('Idle timeout: User is already logged out.');
      }
    }, 60 * 60 * 1000); // 40 seconds
  };

  // Reset the idle timer on user interaction
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('keydown', resetIdleTimer);
  window.addEventListener('click', resetIdleTimer);

  // Initialize the idle timer
  resetIdleTimer();
};

// Function to fetch data from a given URL with auth headers
export const fetchData = async (url: string) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
};
