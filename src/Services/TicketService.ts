import axios from 'axios';
import { API_URL as BASE_API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same URL as before (http://localhost:8000/api/tickets/), built from the shared API URL.
// Always ends with a slash.
const API_URL = `${BASE_API_URL}tickets/`;

export interface Ticket {
    TicketID: string;
    full_name: string;
    email: string;
    phone_number: string;
    section: string;
    severity: string;
    description: string;
    screenshot?: string;
    created_at: string;
    status: 'unattended' | 'in_progress' | 'resolved';
}

export interface TicketLog {
    ticket: Ticket; // Assuming you want to reference the Ticket
    user_email: string;
    changed_fields: string;
    timestamp: string;
}

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. Credentials travel in HttpOnly cookies,
// so nothing here builds auth headers.

// Fetch all tickets
export const fetchTickets = async (): Promise<Ticket[]> => {
    try {
        const response = await axios.get<Ticket[]>(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
};

// Fetch logs for a specific ticket
export const fetchTicketLogs = async (ticketId: number): Promise<TicketLog[]> => {
    try {
        const response = await axios.get<TicketLog[]>(`${API_URL}${ticketId}/logs/`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching logs for ticket ${ticketId}:`, error);
        throw error;
    }
};

// Edit a ticket
export const editTicket = async (id: string, updatedData: Partial<Ticket>): Promise<Ticket> => {
    try {
        const response = await axios.put<Ticket>(`${API_URL}${id}/`, updatedData);
        return response.data;
    } catch (error) {
        console.error(`Error updating ticket ${id}:`, error);
        throw error;
    }
};

// Delete a ticket
export const deleteTicket = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}${id}/`);
    } catch (error) {
        console.error(`Error deleting ticket ${id}:`, error);
        throw error;
    }
};