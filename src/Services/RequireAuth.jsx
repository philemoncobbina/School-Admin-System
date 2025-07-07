import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from './Login'; // Correct import path to Login.ts

const RequireAuth = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const authStatus = await isLoggedIn(); // Call the backend to check if the user is logged in
      setLoggedIn(authStatus.loggedIn);
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!loggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RequireAuth;
