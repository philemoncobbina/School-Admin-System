import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import admissionService from '../../Services/admissionService';
import PersonalInformation from './PersonalInformation';
import ParentGuardianInformation from './ParentGuardianInformation';
import EducationHistory from './EducationHistory';
import HealthInformation from './HealthInformation';
import ConfirmationModal from './ConfirmationModal';
import AdmissionDetails  from './AdmissionDetails';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const EditAdmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    home_address: '',
    age: '',
    language_spoken: '',
    country_of_citizenship: '',
    gender: '',
    date_of_birth: '',
    parent_full_name: '',
    occupation: '',
    phone_number: '',
    email: '',
    parent_home_address: '',
    previous_school_name: '',
    previous_class: '',
    previous_school_address: '',
    start_date: '',
    end_date: '',
    emergency_contact: '',
    emergency_contact_number: '',
    medical_conditions: '',
    allergies: '',
    user_email: '',
    disabilities: '',
    status: 'pending',
    vaccinated: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdmission = async () => {
      try {
        const data = await admissionService.fetchAdmissions();
        const admissionToEdit = data.find(ad => ad.id === parseInt(id));
        if (admissionToEdit) {
          setFormData(admissionToEdit);
          setOriginalData(admissionToEdit);
        } else {
          setError('Admission not found.');
        }
      } catch (err) {
        setError('Failed to load admission data.');
      }
    };
    fetchAdmission();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = (e) => {
    e.preventDefault(); // Prevent default action
    console.log('Edit button clicked'); // Debugging line
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(originalData); // Reset form data to original
    setIsEditing(false);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      await admissionService.editStudent(id, formData);
      alert('Student updated successfully!');
      navigate('/dashboard/admissions');
    } catch (err) {
      setError('Failed to update student.');
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await admissionService.deleteAdmission(id);
      navigate('/dashboard/admissions');
    } catch (err) {
      setError('Failed to delete admission.');
    }
    setIsModalOpen(false);
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Admission</h1>
      <form onSubmit={handleSaveChanges} className="space-y-6" >
        <AdmissionDetails formData={formData} handleChange={handleChange} editable={isEditing} />
        <PersonalInformation formData={formData} handleChange={handleChange} editable={isEditing} />
        <ParentGuardianInformation formData={formData} handleChange={handleChange} editable={isEditing} />
        <EducationHistory formData={formData} handleChange={handleChange} editable={isEditing} />
        <HealthInformation formData={formData} handleChange={handleChange} editable={isEditing} />
        <div className="mt-4">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={handleEditClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                <FaEdit className="inline mr-2" /> Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="ml-4 px-4 py-2 bg-red-500 text-white rounded-md"
              >
                <FaTrashAlt className="inline mr-2" /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-md"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="ml-4 px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        admissionNumber={formData.admission_number}
      />
    </div>
  );
};

export default EditAdmission;
