import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/admin'; // Adjust to your backend URL

// Function to get authorization headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token'); // Adjust based on where you store the token
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

// Fetch all users
export const fetchAllUsers = () => {
    return axios.get(`${API_URL}/users/`, {
        headers: getAuthHeaders(),
    });
};

// Block a user
export const blockUser = (userId) => {
    return axios.patch(`${API_URL}/user/${userId}/`, { action: 'block' }, {
        headers: getAuthHeaders(),
    });
};

// Unblock a user
export const unblockUser = (userId) => {
    return axios.patch(`${API_URL}/user/${userId}/`, { action: 'unblock' }, {
        headers: getAuthHeaders(),
    });
};

// Activate a user
export const activateUser = (userId) => {
    return axios.patch(`${API_URL}/user/${userId}/`, { action: 'activate' }, {
        headers: getAuthHeaders(),
    });
};

// Edit user details
export const editUser = (userId, updatedData) => {
    return axios.patch(`${API_URL}/user/${userId}/`, { ...updatedData, action: 'edit' }, {
        headers: getAuthHeaders(),
    });
};

// Delete user
export const deleteUser = (userId) => {
    return axios.delete(`${API_URL}/user/${userId}/`, {
        headers: getAuthHeaders(),
    });
};
