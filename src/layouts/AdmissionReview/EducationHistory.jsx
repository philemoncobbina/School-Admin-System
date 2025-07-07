import React from 'react';

const EducationHistory = ({ formData, handleChange, editable }) => {
  return (
    <div className="border border-gray-200 p-6 rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Education History</h2>
      {[
        { label: 'Previous School Name', name: 'previous_school_name', type: 'text' },
        { label: 'Previous Class', name: 'previous_class', type: 'text' },
        { label: 'Previous School Address', name: 'previous_school_address', type: 'text' },
        { label: 'Start Date', name: 'start_date', type: 'date' },
        { label: 'End Date', name: 'end_date', type: 'date' }
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
            max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined} // Prevent future dates
            placeholder={label}
          />
        </div>
      ))}
    </div>
  );
};

export default EducationHistory;
