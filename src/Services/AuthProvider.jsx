import React, { createContext, useContext, useEffect, useState } from 'react';
import { isLoggedIn, startIdleTimer, startTestSessionTimer } from './Login';

// Create context
const AuthContext = createContext({ 
  loggedIn: false, 
  loading: true,
  user: null 
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [state, setState] = useState({ 
    loggedIn: false, 
    loading: true, 
    user: null 
  });

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await isLoggedIn(); // single API call for whole app
      
      setState({
        loggedIn: authStatus.loggedIn,
        user: authStatus.user ?? null,
        loading: false,
      });

      // Only start timers if actually logged in
      if (authStatus.loggedIn) {
        startIdleTimer();
        startTestSessionTimer();
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;