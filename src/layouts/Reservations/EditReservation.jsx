import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBookings, fetchReservationLogs, deleteBooking, updateBooking } from '../../Services/BookingService';
import UserService from '../../Services/UserService';
import NoAccessModal from './NoAccessModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { FaArrowLeft } from 'react-icons/fa';

const EditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNoAccessModalOpen, setIsNoAccessModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalBooking, setOriginalBooking] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const bookings = await fetchBookings();
        const selectedBooking = bookings.find(b => b.id === parseInt(id));

        if (selectedBooking) {
          setBooking(selectedBooking);
          setOriginalBooking({ ...selectedBooking });
          const bookingLogs = await fetchReservationLogs(selectedBooking.id);
          setLogs(bookingLogs);
        } else {
          setError('Booking not found');
        }
      } catch (error) {
        const backendError = error.response?.data?.message || 'Error fetching booking details.';
        setError(backendError);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserRole = async () => {
      try {
        const userDetails = await UserService.getUserDetails();
        setUserRole(userDetails.role);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchDetails();
    fetchUserRole();
  }, [id]);

  const handleInputChange = ({ target: { name, value } }) => {
    setBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateBooking(booking.id, booking);
      alert('Booking updated successfully!');
      navigate('/dashboard/reservations');
    } catch (error) {
      console.error('Error response:', error.response);
      let backendError = 'An error occurred while updating the booking.';

      if (error.response?.data) {
        const errorData = error.response.data;
        const fieldErrors = Object.keys(errorData).map((field) => {
          const errorMessages = errorData[field];
          return `${field}: ${Array.isArray(errorMessages) ? errorMessages.join(' ') : errorMessages}`;
        }).join('\n');

        backendError = fieldErrors || backendError;
      }

      if (error.response?.status === 409) {
        backendError = 'There is already a confirmed booking at this date and time for the same department.';
      }

      setError(backendError);
    }
  };

  const handleCancelChanges = () => {
    setBooking({ ...originalBooking });
    setIsEditing(false);
  };

  const handleDeleteBooking = async () => {
    try {
      await deleteBooking(booking.id);
      navigate('/dashboard/reservations');
      setIsDeleteModalOpen(false);
    } catch (error) {
      const backendError = error.response?.data?.message || 'An error occurred while deleting the booking.';
      setError(backendError);
    }
  };

  const startEditing = (e) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const openDeleteModal = () => {
    userRole === 'principal' ? setIsDeleteModalOpen(true) : setIsNoAccessModalOpen(true);
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button
          className="text-blue-500 flex items-center space-x-2 hover:text-blue-700 transition duration-200"
          onClick={() => navigate('/dashboard/reservations')}
        >
          <FaArrowLeft />
          <span className="text-lg font-medium">Back to Reservations</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Edit Reservation</h1>
      </div>
      {error && <div className="mb-4 text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

      <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        {['full_name', 'email', 'phone', 'booking_date', 'booking_time', 'department', 'message', 'status'].map((field, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <label className="text-lg font-medium text-gray-700">
              {field.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
            </label>
            {field === 'department' ? (
              <select
                name={field}
                value={booking[field] || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {['Finance Department', 'Admissions Department', 'Student Affairs', 'Human Resource Department', 'Academics Department'].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            ) : field === 'status' ? (
              <select
                name={field}
                value={booking[field] || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                {['Pending', 'Confirmed', 'Cancelled'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.includes('date') ? 'date' : field.includes('time') ? 'time' : 'text'}
                name={field}
                value={booking[field] || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="flex space-x-4">
          {isEditing ? (
            <>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelChanges}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition duration-200"
              >
                Cancel Changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={openDeleteModal}
                className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>

      {/* Logs Section */}
      <h2 className="text-2xl font-bold text-gray-800 mt-8">Change Logs</h2>
      {logs.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 p-3 text-left text-gray-700">User Email</th>
                <th className="border border-gray-300 p-3 text-left text-gray-700">Changed Fields</th>
                <th className="border border-gray-300 p-3 text-left text-gray-700">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-200">
                  <td className="border border-gray-300 p-3">{log.user_email}</td>
                  <td className="border border-gray-300 p-3">{log.changed_fields}</td>
                  <td className="border border-gray-300 p-3">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 text-gray-600">No logs available.</div>
      )}

      {/* Modals */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onConfirm={handleDeleteBooking}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
      {isNoAccessModalOpen && (
        <NoAccessModal
          isOpen={isNoAccessModalOpen}
          onClose={() => setIsNoAccessModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EditReservation;
