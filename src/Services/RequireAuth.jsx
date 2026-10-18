import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from './Login';

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, loggedIn: false });

  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      let loggedIn = false;

      try {
        // The server decides. The cookie is the credential; localStorage is never trusted here.
        const authStatus = await isLoggedIn();
        loggedIn = Boolean(authStatus.loggedIn);
      } catch (error) {
        console.error('Authentication check failed:', error);
      }

      if (active) {
        setState({ loading: false, loggedIn });
      }
    };

    checkAuthStatus();

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <div>Loading...</div>;
  }

  if (!state.loggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;