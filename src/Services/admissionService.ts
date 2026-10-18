// admissionService.js
import axios from 'axios';
import { API_URL as BASE_API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same URL as before (http://localhost:8000/api/admissions/), built from the shared API URL.
// Always ends with a slash.
const API_URL = `${BASE_API_URL}admissions/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.

const submitForm = async (formData) => {
  try {
    const response = await axios.post(API_URL, formData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const editStudent = async (id, formData) => {
  try {
    const response = await axios.put(`${API_URL}${id}/`, formData);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const fetchAdmissions = async () => {
  try {
    const response = await axios.get(`${API_URL}all_admissions/`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const deleteAdmission = async (id) => {
  try {
    await axios.delete(`${API_URL}${id}/`);
    console.log(`Student with ID ${id} deleted successfully.`);
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const handleAxiosError = (error) => {
  if (axios.isAxiosError(error)) {
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);

      if (error.response.status === 404) {
        console.error('No admissions found.');
      }
    } else {
      console.error('No response received from server.');
    }
  } else {
    console.error('Unexpected error:', error);
  }
};

export default { submitForm, editStudent, fetchAdmissions, deleteAdmission };