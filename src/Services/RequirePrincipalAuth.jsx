import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from './Login';

const RequirePrincipalAuth = ({ children }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    loading: true,
    loggedIn: false,
    authorized: false,
  });

  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      let next = { loading: false, loggedIn: false, authorized: false };

      try {
        // The role comes from the server on every check, so editing localStorage can't change it.
        const authStatus = await isLoggedIn();
        const user = authStatus.user;

        next = {
          loading: false,
          loggedIn: Boolean(authStatus.loggedIn),
          authorized:
            Boolean(authStatus.loggedIn) &&
            (user?.role === 'principal' || user?.is_superuser === true),
        };
      } catch (error) {
        console.error('Authorization failed:', error);
      }

      if (active) {
        setAuthState(next);
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!authState.authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequirePrincipalAuth;