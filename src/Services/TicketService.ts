import axios from 'axios';

const API_URL = 'https://api.plvcmonline.uk/api/tickets/'; // Replace with your actual API URL

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

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        throw new Error('No access token found');
    }
    return { Authorization: `Bearer ${accessToken}` };
};

// Fetch all tickets
export const fetchTickets = async (): Promise<Ticket[]> => {
    try {
        const response = await axios.get<Ticket[]>(API_URL, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
};

// Fetch logs for a specific ticket
export const fetchTicketLogs = async (ticketId: number): Promise<TicketLog[]> => {
    try {
        const response = await axios.get<TicketLog[]>(`${API_URL}${ticketId}/logs/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching logs for ticket ${ticketId}:`, error);
        throw error;
    }
};

// Edit a ticket
export const editTicket = async (id: string, updatedData: Partial<Ticket>): Promise<Ticket> => {
    try {
        const response = await axios.put<Ticket>(`${API_URL}${id}/`, updatedData, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating ticket ${id}:`, error);
        throw error;
    }
};

// Delete a ticket
export const deleteTicket = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}${id}/`, {
            headers: getAuthHeaders(),
        });
    } catch (error) {
        console.error(`Error deleting ticket ${id}:`, error);
        throw error;
    }
};
