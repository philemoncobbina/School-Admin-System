// admissionService.js
import axios from 'axios';

const API_URL = 'https://api.plvcmonline.uk/api/admissions/'; // Base URL for admissions

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${accessToken}` };
};

const submitForm = async (formData) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_URL}`, formData, { headers });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const editStudent = async (id, formData) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.put(`${API_URL}${id}/`, formData, { headers }); // Corrected URL
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const fetchAdmissions = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_URL}all_admissions/`, { headers }); // Use my_admissions for fetching
    return response.data;
  } catch (error) {
    handleAxiosError(error);
    throw error;
  }
};

const deleteAdmission = async (id) => {
  try {
    const headers = getAuthHeaders();
    await axios.delete(`${API_URL}${id}/`, { headers });
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
