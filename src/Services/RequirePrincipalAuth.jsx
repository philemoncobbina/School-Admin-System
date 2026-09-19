import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from './Login';

const RequirePrincipalAuth = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    loggedIn: false,
    authorized: false,
  });

  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      try {
        const authStatus = await isLoggedIn();

        if (!active) {
          return;
        }

        setAuthState({
          loading: false,
          loggedIn: Boolean(authStatus.loggedIn),
          authorized:
            Boolean(authStatus.loggedIn) &&
            authStatus.user?.role === 'principal',
        });
      } catch (error) {
        console.error('Authorization failed:', error);

        if (active) {
          setAuthState({
            loading: false,
            loggedIn: false,
            authorized: false,
          });
        }
      }
    };

    checkAuthStatus();

    return () => {
      active = false;
    };
  }, []);

  if (authState.loading) {
    return <div>Loading...</div>;
  }

  if (!authState.loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!authState.authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequirePrincipalAuth;