const AdmissionDetails = ({ formData, handleChange, editable }) => {
    const STATUS_CHOICES = ['pending', 'in_review', 'approved', 'rejected'];
  
    // Function to format date in yyyy-MM-dd format
    const formatDate = (date) => {
      if (!date) return '';  // Handle case if no date is provided
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0'); // Ensure two-digit month
      const day = d.getDate().toString().padStart(2, '0'); // Ensure two-digit day
      return `${year}-${month}-${day}`;
    };
  
    return (
      <div className="space-y-6 bg-gray-100 p-6 rounded-md shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admission Status Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admission Number - Always Read Only */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Admission Number
            </label>
            <input
              type="text"
              name="admission_number"
              value={formData.admission_number || ''}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="text"
              name="admission_number"
              value={formData.user_email || ''}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
            />
          </div>
  
          {/* Submission Date - Always Read Only */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Submission Date
            </label>
            <input
              type="date"
              name="submit_date"
              value={formatDate(formData.submit_date)}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
            />
          </div>
  
          {/* Status - Editable based on editable prop */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Application Status
            </label>
            <select
              name="status"
              value={formData.status || 'pending'}
              onChange={handleChange}
              disabled={!editable}
              className={`w-full px-3 py-2 border rounded-md ${
                editable ? 'bg-white hover:border-blue-500' : 'bg-gray-100'
              } ${editable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {STATUS_CHOICES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };
  
  export default AdmissionDetails;
  