import axios, { AxiosResponse } from 'axios';

// Import the getAuthHeaders function
const getAuthHeaders = (): { Authorization: string } => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        throw new Error('No access token found');
    }
    return { Authorization: `Bearer ${accessToken}` };
};

// Define the contact data type
interface Contact {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    message: string;
    timestamp: string;
    status: 'unattended' | 'in_progress' | 'resolved'; // Status choices
    action_taken?: string; // Optional field
}

interface ContactLog {
    id: number;
    contact: number; // This refers to the ID of the contact
    user: number | null; // Optional field for user ID
    user_email: string; // User's email
    changed_fields: string; // Fields that were changed
    timestamp: string; // When the log entry was created
}

const API_URL = 'https://api.plvcmonline.uk/api/contacts/'; // Replace with your actual API URL

class ContactService {
    async getContacts(): Promise<Contact[]> {
        const response: AxiosResponse<Contact[]> = await axios.get(API_URL, {
            headers: getAuthHeaders(), // Add auth headers
        });
        return response.data;
    }

    async getContactById(id: number): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.get(`${API_URL}${id}/`, {
            headers: getAuthHeaders(), // Add auth headers
        });
        return response.data;
    }

    async createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.post(API_URL, contact, {
            headers: getAuthHeaders(), // Add auth headers
        });
        return response.data;
    }

    async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.put(`${API_URL}${id}/`, contact, {
            headers: getAuthHeaders(), // Add auth headers
        });
        return response.data;
    }

    async deleteContact(id: number): Promise<void> {
        await axios.delete(`${API_URL}${id}/`, {
            headers: getAuthHeaders(), // Add auth headers
        });
    }

    // New method to get logs for a specific contact
    async getContactLogs(contactId: number): Promise<ContactLog[]> {
        const response: AxiosResponse<ContactLog[]> = await axios.get(`${API_URL}${contactId}/logs/`, {
            headers: getAuthHeaders(), // Add auth headers
        });
        return response.data;
    }
}

export default new ContactService();
