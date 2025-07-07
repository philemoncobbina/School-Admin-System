import React, { useEffect } from 'react';
import { isLoggedInSync, startIdleTimer, startTestSessionTimer } from './Login';

const AuthProvider = ({ children }) => {
  useEffect(() => {
    if (isLoggedInSync()) {
      startIdleTimer();
      startTestSessionTimer();
    }
  }, []);

  return <>{children}</>;
};

export default AuthProvider;
