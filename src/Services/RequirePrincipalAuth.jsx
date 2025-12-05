import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn } from './Login';

const RequirePrincipalAuth = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await isLoggedIn(); // Check if the user is logged in
        setLoggedIn(authStatus.loggedIn);

        if (authStatus.loggedIn) {
          const response = await axios.get('https://api.plvcmonline.uk/api/user-detail-auth/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          });

          if (response.data.role === 'principal') {
            setAuthorized(true);
          }
        }
      } catch (error) {
        console.error('Authorization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!loggedIn) {
    return <Navigate to="/login" />;
  }

  if (!authorized) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RequirePrincipalAuth;
