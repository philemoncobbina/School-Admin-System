import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PersonalInformation = ({ formData, handleChange, editable }) => {
  const [countries, setCountries] = useState([]);
  const [dateError, setDateError] = useState('');

  // Fetch country names from REST API
  useEffect(() => {
    axios.get('https://restcountries.com/v3.1/all')
      .then(response => {
        const countryNames = response.data.map(country => country.name.common);
        setCountries(countryNames.sort());
      })
      .catch(error => {
        console.error("Error fetching countries:", error);
      });
  }, []);

  // Calculate age from date of birth
  useEffect(() => {
    const calculateAge = () => {
      if (formData.date_of_birth) {
        const dob = new Date(formData.date_of_birth);
        const today = new Date();

        if (dob > today) {
          setDateError('Date of birth cannot be in the future.');
          return '';
        } else {
          setDateError('');
          let age = today.getFullYear() - dob.getFullYear();
          const monthDifference = today.getMonth() - dob.getMonth();

          // Adjust age if birthday hasn't occurred yet this year
          if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
            age--;
          }

          // Display age as less than a year if applicable
          if (age < 1 && (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
            return 'Less than a year';
          }

          return age;
        }
      }
      return '';
    };

    if (formData.date_of_birth) {
      const age = calculateAge();
      handleChange({ target: { name: 'age', value: age } });
    }
  }, [formData.date_of_birth, handleChange]);

  const handleDateChange = (e) => {
    const { value } = e.target;
    const selectedDate = new Date(value);
    const today = new Date();

    if (selectedDate > today) {
      setDateError('Date of birth cannot be in the future.');
    } else {
      setDateError('');
    }

    handleChange(e); // Update form data
  };

  return (
    <div className="border border-gray-200 p-6 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
      {[
        { label: 'First Name', name: 'first_name', type: 'text' },
        { label: 'Last Name', name: 'last_name', type: 'text' },
        { label: 'Middle Name', name: 'middle_name', type: 'text' },
        { label: 'Home Address', name: 'home_address', type: 'text' },
        { label: 'Date of Birth', name: 'date_of_birth', type: 'date' },
        { label: 'Age', name: 'age', type: 'text', disabled: true },
        { label: 'Language Spoken', name: 'language_spoken', type: 'text' },
        { label: 'Country of Citizenship', name: 'country_of_citizenship', type: 'select', options: countries },
        { label: 'Gender', name: 'gender', type: 'text' },
      ].map(({ label, name, type, options, disabled }) => (
        <div key={name} className="mb-6">
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
          {type === 'select' ? (
            <select
              name={name}
              id={name}
              value={formData[name]}
              onChange={handleChange}
              disabled={!editable}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type={type}
                name={name}
                id={name}
                value={formData[name]}
                onChange={name === 'date_of_birth' ? handleDateChange : handleChange}
                disabled={disabled || !editable}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}
                max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined} // Prevent future dates
                placeholder={label}
              />
              {name === 'date_of_birth' && dateError && (
                <p className="text-red-500 text-sm mt-1">{dateError}</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalInformation;
