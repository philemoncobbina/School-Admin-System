import React from 'react';

const ParentGuardianInformation = ({ formData, handleChange, editable }) => {
  return (
    <div className="border border-gray-200 p-6 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent / Guardian Information</h2>
      {[
        { label: 'Parent Full Name', name: 'parent_full_name', type: 'text' },
        { label: 'Occupation', name: 'occupation', type: 'text' },
        { label: 'Phone Number', name: 'phone_number', type: 'text' },
        { label: 'Email', name: 'email', type: 'email' },
        { label: 'Parent Home Address', name: 'parent_home_address', type: 'text' }
      ].map(({ label, name, type }) => (
        <div key={name} className="mb-6">
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
          <input
            id={name}
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            disabled={!editable}
            className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editable ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}
            placeholder={label}
          />
        </div>
      ))}
    </div>
  );
};

export default ParentGuardianInformation;
