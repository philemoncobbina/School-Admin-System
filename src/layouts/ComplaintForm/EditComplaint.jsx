import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContactService from '../../Services/ContactService';
import UserService from '../../Services/UserService';
import { FaTrashAlt, FaSave } from 'react-icons/fa';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import NoAccessModal from './NoAccessModal';
import { FaArrowLeft } from 'react-icons/fa';


const EditComplaint = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState({
        id: 0,
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        message: '',
        date: '',
        time: '',
        status: 'unattended',
        action_taken: '',
    });
    const [userRole, setUserRole] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNoAccessModalOpen, setIsNoAccessModalOpen] = useState(false);
    const [errorMessages, setErrorMessages] = useState([]);
    const [contactLogs, setContactLogs] = useState([]);

    useEffect(() => {
        fetchComplaintDetails();
        fetchUserRole();
        fetchContactLogs();
    }, []);

    const fetchComplaintDetails = async () => {
        try {
            const data = await ContactService.getContactById(id);
            const [date, fullTime] = data.timestamp.split('T');
            const time = fullTime.split('.')[0]; // Get just the HH:mm:ss part
            setComplaint({ ...data, date, time });
        } catch (error) {
            console.error('Error fetching complaint details:', error);
        }
    };

    const fetchUserRole = async () => {
        try {
            const userDetails = await UserService.getUserDetails();
            setUserRole(userDetails.role);
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    };

    const fetchContactLogs = async () => {
        try {
            const logs = await ContactService.getContactLogs(id);
            setContactLogs(logs); // Set the logs to state
        } catch (error) {
            console.error('Error fetching contact logs:', error);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setComplaint((prevComplaint) => ({ ...prevComplaint, [name]: value }));
        setErrorMessages([]);
    };

    const handleSaveChanges = async () => {
        try {
            const { date, time, ...rest } = complaint;
            const timestamp = `${date}T${time}`;
            await ContactService.updateContact(id, { ...rest, timestamp });
            navigate('/dashboard/complaints');
        } catch (error) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'string') {
                    try {
                        const parsedErrorData = JSON.parse(errorData);
                        setErrorMessages(parsedErrorData.non_field_errors || []);
                    } catch (parseError) {
                        console.error('Failed to parse error response:', parseError);
                        setErrorMessages(['An unexpected error occurred.']);
                    }
                } else {
                    setErrorMessages(errorData.non_field_errors || []);
                }
            } else {
                console.error('Error updating complaint:', error);
                setErrorMessages(['An unexpected error occurred.']);
            }
        }
    };

    const openDeleteModal = () => {
        if (userRole === 'principal') {
            setIsDeleteModalOpen(true);
        } else {
            setIsNoAccessModalOpen(true);
        }
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const closeNoAccessModal = () => {
        setIsNoAccessModalOpen(false);
    };

    const handleDelete = async () => {
        try {
            await ContactService.deleteContact(id);
            navigate('/dashboard/complaints');
        } catch (error) {
            console.error('Error deleting complaint:', error);
        }
    };

    return (
        <div className="p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
        <button
          className="text-blue-500 flex items-center space-x-2 hover:text-blue-700 transition duration-200"
          onClick={() => navigate('/dashboard/complaints')}
        >
          <FaArrowLeft />
          <span className="text-lg font-medium">Back to Complaint </span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Edit Complaint </h1>
      </div>
            <div className="bg-white shadow-md rounded-lg p-6 mb-4 border border-gray-200">
                {errorMessages.length > 0 && (
                    <div className="mb-4">
                        <ul className="text-red-600 list-disc list-inside">
                            {errorMessages.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                    {/* Display fields as outputs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.firstName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.lastName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.phoneNumber}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Complaint Message</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.message}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.date}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <p className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100">{complaint.time}</p>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            value={complaint.status}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        >
                            <option value="unattended">Unattended</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="action_taken" className="block text-sm font-medium text-gray-700">
                            Action Taken (Optional)
                        </label>
                        <textarea
                            name="action_taken"
                            id="action_taken"
                            value={complaint.action_taken}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            rows="2"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <button
                        className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleSaveChanges}
                    >
                        <FaSave className="mr-2" />
                        Save Changes
                    </button>
                    <button
                        className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={openDeleteModal}
                    >
                        <FaTrashAlt className="mr-2" />
                        Delete Complaint
                    </button>
                </div>
            </div>

               {/* Contact Logs Section */}
           
              {/* Logs Section */}
      {/* Logs Section */}
<h2 className="text-2xl font-bold text-gray-800 mt-8">Change Logs</h2>
{contactLogs.length > 0 ? (
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
        {contactLogs.map((log, index) => (
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



            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onDelete={handleDelete}
            />

            {/* No Access Modal */}
            <NoAccessModal isOpen={isNoAccessModalOpen} onClose={closeNoAccessModal} />
        </div>
    );
};

export default EditComplaint;
