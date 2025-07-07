import React from 'react';

const IdleTimeoutModal = ({ show, handleLogout, handleStayLoggedIn }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Idle Timeout Warning</h2>
          <button onClick={handleStayLoggedIn} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="p-4">
          <p>You've been idle for a while. For security reasons, you will be logged out after 30 seconds of inactivity. If you'd like to stay logged in, please click "Stay Logged In."</p>
        </div>
        <div className="flex justify-end border-t p-4">
          <button onClick={handleLogout} className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600">
            Log Out
          </button>
          <button onClick={handleStayLoggedIn} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeoutModal;
