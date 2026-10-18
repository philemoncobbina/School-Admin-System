import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

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

// Same base as before (http://localhost:8000/api/reservations/), built from the shared API_URL.
// Always ends with a slash.
const RESERVATIONS_URL = `${API_URL}reservations/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. Credentials travel in HttpOnly cookies,
// so nothing here builds auth headers.

// Fetch all bookings
export const fetchBookings = async (): Promise<Booking[]> => {
  const response: AxiosResponse<Booking[]> = await axios.get(RESERVATIONS_URL);
  return response.data;
};

// Fetch reservation logs by reservation ID
export const fetchReservationLogs = async (reservationId: number): Promise<ReservationLog[]> => {
  try {
    const response: AxiosResponse<ReservationLog[]> = await axios.get(
      `${RESERVATIONS_URL}${reservationId}/logs/`
    );
    console.log(`Logs for reservation ID ${reservationId} fetched successfully.`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch logs for reservation ID ${reservationId}:`, error);
    throw error; // Re-throw to handle in the UI
  }
};

// Delete a booking by ID
export const deleteBooking = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${RESERVATIONS_URL}${id}/`);
    console.log(`Booking with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error(`Failed to delete booking with ID ${id}:`, error);
    throw error; // Re-throw to handle in the UI
  }
};

// Update a booking
export const updateBooking = async (
  id: number,
  updatedBooking: Partial<Booking>
): Promise<Booking> => {
  try {
    const response: AxiosResponse<Booking> = await axios.put(
      `${RESERVATIONS_URL}${id}/`,
      updatedBooking
    );
    console.log(`Booking with ID ${id} updated successfully.`);
    return response.data;
  } catch (error) {
    console.error(`Failed to update booking with ID ${id}:`, error);
    throw error; // Re-throw to handle in the UI
  }
};