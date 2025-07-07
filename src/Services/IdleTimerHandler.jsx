import React, { useState, useEffect } from 'react';
import { logout } from './Login';
import IdleTimeoutModal from './IdleTimeoutModal';

const IdleTimerHandler = () => {
  const [showIdleModal, setShowIdleModal] = useState(false);
  let idleTimeout, idleWarningTimeout;

  const handleLogout = async () => {
    setShowIdleModal(false);
    await logout();
    console.log('User logged out due to inactivity.');
  };

  const handleStayLoggedIn = () => {
    setShowIdleModal(false);
    resetIdleTimer();  // Reset the timer when user stays logged in
  };

  const resetIdleTimer = () => {
    clearTimeout(idleTimeout);
    clearTimeout(idleWarningTimeout);

    idleWarningTimeout = setTimeout(() => {
      setShowIdleModal(true); // Show the modal after 30 seconds of inactivity
    },  33 * 60 * 1000); // 30 seconds

    idleTimeout = setTimeout(async () => {
      if (localStorage.getItem('access_token')) {
        await logout();
        console.log('Idle timeout: User logged out after 30 more seconds.');
      } else {
        console.log('Idle timeout: User is already logged out.');
      }
    },  33 * 60 * 1000); 
  };

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    resetIdleTimer(); // Initialize the idle timer

    return () => {
      // Clean up event listeners on component unmount
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  return (
    <IdleTimeoutModal 
      show={showIdleModal} 
      handleLogout={handleLogout} 
      handleStayLoggedIn={handleStayLoggedIn} 
    />
  );
};

export default IdleTimerHandler;
