import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

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

// Same base as before (http://localhost:8000/api/contacts/), built from the shared API_URL.
// Always ends with a slash.
const CONTACTS_URL = `${API_URL}contacts/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. Credentials travel in HttpOnly cookies,
// so nothing here builds auth headers.

class ContactService {
    async getContacts(): Promise<Contact[]> {
        const response: AxiosResponse<Contact[]> = await axios.get(CONTACTS_URL);
        return response.data;
    }

    async getContactById(id: number): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.get(`${CONTACTS_URL}${id}/`);
        return response.data;
    }

    async createContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.post(CONTACTS_URL, contact);
        return response.data;
    }

    async updateContact(id: number, contact: Partial<Contact>): Promise<Contact> {
        const response: AxiosResponse<Contact> = await axios.put(`${CONTACTS_URL}${id}/`, contact);
        return response.data;
    }

    async deleteContact(id: number): Promise<void> {
        await axios.delete(`${CONTACTS_URL}${id}/`);
    }

    // New method to get logs for a specific contact
    async getContactLogs(contactId: number): Promise<ContactLog[]> {
        const response: AxiosResponse<ContactLog[]> = await axios.get(`${CONTACTS_URL}${contactId}/logs/`);
        return response.data;
    }
}

export default new ContactService();