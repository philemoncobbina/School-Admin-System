import axios, { AxiosResponse } from 'axios';

// Define the booking data type
export interface Booking {
  id: number;
  full_name: string; // models.CharField(max_length=100)
  email: string; // models.EmailField()
  phone: string; // models.CharField(max_length=20)
  booking_date: string; // models.DateField()
  booking_time: string; // models.TimeField()
  department: string; // models.CharField(max_length=50, choices=DEPARTMENTS)
  message?: string | null; // models.TextField(blank=True, null=True)
  status: string; // models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
  created_at: string; // models.DateTimeField(auto_now_add=True)
  updated_at: string; // models.DateTimeField(auto_now=True)
  
}

// Define the reservation log data type
export interface ReservationLog {
  id: number;
  reservation: number; // ForeignKey to reservation
  user_email: string; // Email of the user who made the change
  changed_fields: string; // Fields that were changed in the reservation
  timestamp: string; // models.DateTimeField(auto_now_add=True)
}

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }
  return { Authorization: `Bearer ${accessToken}` };
};

// Fetch all bookings
export const fetchBookings = async (): Promise<Booking[]> => {
  const response: AxiosResponse = await axios.get('https://api.plvcmonline.uk/api/reservations/', {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Fetch reservation logs by reservation ID
export const fetchReservationLogs = async (reservationId: number): Promise<ReservationLog[]> => {
  try {
    const response: AxiosResponse = await axios.get(`https://api.plvcmonline.uk/api/reservations/${reservationId}/logs/`, {
      headers: getAuthHeaders(),
    });
    console.log(`Logs for reservation ID ${reservationId} fetched successfully.`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch logs for reservation ID ${reservationId}:`, error);
    throw error;  // Re-throw to handle in the UI
  }
};

// Delete a booking by ID
export const deleteBooking = async (id: number): Promise<void> => {
  try {
    await axios.delete(`https://api.plvcmonline.uk/api/reservations/${id}/`, {
      headers: getAuthHeaders(),
    });
    console.log(`Booking with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error(`Failed to delete booking with ID ${id}:`, error);
    throw error;  // Re-throw to handle in the UI
  }
};

// Update a booking
export const updateBooking = async (id: number, updatedBooking: Partial<Booking>): Promise<Booking> => {
  try {
    const response: AxiosResponse = await axios.put(
      `https://api.plvcmonline.uk/api/reservations/${id}/`, 
      updatedBooking,
      { headers: getAuthHeaders() }
    );
    console.log(`Booking with ID ${id} updated successfully.`);
    return response.data;
  } catch (error) {
    console.error(`Failed to update booking with ID ${id}:`, error);
    throw error;  // Re-throw to handle in the UI
  }
};
