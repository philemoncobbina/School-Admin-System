import React from 'react';

const HealthInformation = ({ formData, handleChange, editable }) => {
  return (
    <div className="border border-gray-200 p-6 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Information</h2>
      {[
        { label: 'Emergency Contact', name: 'emergency_contact', type: 'text' },
        { label: 'Emergency Contact Number', name: 'emergency_contact_number', type: 'text' },
        { label: 'Medical Conditions', name: 'medical_conditions', type: 'text' },
        { label: 'Allergies', name: 'allergies', type: 'text' }
      ].map(({ label, name, type }) => (
        <div key={name} className="mb-6">
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
          <input
            type={type}
            name={name}
            id={name}
            value={formData[name]}
            onChange={handleChange}
            disabled={!editable}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editable ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}
            placeholder={label}
          />
        </div>
      ))}
      <div className="mb-6">
        <label htmlFor="disabilities" className="block text-sm font-semibold text-gray-700 mb-1">Disabilities</label>
        <select
          name="disabilities"
          id="disabilities"
          value={formData.disabilities}
          onChange={handleChange}
          disabled={!editable}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="vaccinated" className="block text-sm font-semibold text-gray-700 mb-1">Vaccinated</label>
        <select
          name="vaccinated"
          id="vaccinated"
          value={formData.vaccinated}
          onChange={handleChange}
          disabled={!editable}
          className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-white border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
    </div>
  );
};

export default HealthInformation;
