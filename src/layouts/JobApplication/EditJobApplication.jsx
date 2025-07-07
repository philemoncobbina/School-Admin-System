import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../../Services/Jobapplication';
import { FaArrowLeft } from 'react-icons/fa';
import { FiTrash2, FiSave, FiClock } from 'react-icons/fi';

const EditJobApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState({});
  const [resumeFileName, setResumeFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch application details
        const applicationData = await jobApplicationService.getApplicationById(id);
        setApplication(applicationData);
        
        if (applicationData.resume && typeof applicationData.resume === 'string') {
          const parts = applicationData.resume.split('/');
          setResumeFileName(parts[parts.length - 1]);
        }
        
        // Fetch application logs
        const logsData = await jobApplicationService.getApplicationLogs(id);
        setLogs(logsData);
      } catch (err) {
        setError('Failed to load application details');
        console.error(err);
      } finally {
        setLoading(false);
        setLogsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      // Only include editable fields
      const updatedData = {
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.email,
        educational_level: application.educational_level,
        status: application.status
      };

      await jobApplicationService.updateApplication(id, updatedData);

      // Refresh logs after update
      const logsData = await jobApplicationService.getApplicationLogs(id);
      setLogs(logsData);

      setLoading(false);
      navigate('/dashboard/jobapplication', { state: { message: 'Application updated successfully!' } });
    } catch (err) {
      setLoading(false);
      setError('Failed to update application');
      console.error('Failed to update:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        setLoading(true);
        await jobApplicationService.deleteApplication(id);
        navigate('/dashboard/jobapplication', { state: { message: 'Application deleted successfully!' } });
      } catch (err) {
        setError('Failed to delete application');
        console.error('Failed to delete application:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const parseChangedFields = (changedFieldsStr) => {
    try {
      return JSON.parse(changedFieldsStr);
    } catch (e) {
      return changedFieldsStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg shadow mb-4">
        <p className="text-red-700 font-medium">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/jobapplication')}
          className="mt-2 text-red-700 underline"
        >
          Back to applications
        </button>
      </div>
    );
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SHORTLISTED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    HIRED: 'bg-green-100 text-green-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Simplified Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            className="text-blue-500 flex items-center space-x-2 hover:text-blue-700 transition duration-200"
            onClick={() => navigate('/dashboard/jobapplication')}
          >
            <FaArrowLeft />
            <span className="text-lg font-medium">Back to Applications</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Job Application</h1>
        </div>
        
        {/* Job summary info */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="text-sm text-gray-500">Job Title</div>
            <div className="font-medium">{application.job_title || 'Untitled Position'}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Reference</div>
            <div className="font-medium">{application.job_reference_number || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={application.first_name || ''}
              onChange={(e) => setApplication({ ...application, first_name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="First Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={application.last_name || ''}
              onChange={(e) => setApplication({ ...application, last_name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last Name"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={application.email || ''}
            onChange={(e) => setApplication({ ...application, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Educational Level</label>
            <select
              value={application.educational_level || ''}
              onChange={(e) => setApplication({ ...application, educational_level: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="HIGH_SCHOOL">High School</option>
              <option value="ASSOCIATE">Associate</option>
              <option value="BACHELOR">Bachelor</option>
              <option value="MASTER">Master</option>
              <option value="PHD">PhD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
            <select
              value={application.status || ''}
              onChange={(e) => setApplication({ ...application, status: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="REJECTED">Rejected</option>
              <option value="HIRED">Hired</option>
            </select>
            
            {application.status && (
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
                {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
              </div>
            )}
          </div>
        </div>
        
        {/* Resume Section - Read Only */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Resume</label>
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">Read Only</span>
          </div>
          
          {application.resume ? (
            <div className="flex items-center p-3 bg-white rounded border border-gray-200">
              <div className="flex-1 truncate">
                <div className="text-sm font-medium">{resumeFileName || 'Resume'}</div>
                <div className="text-xs text-gray-500">Attached resume file</div>
              </div>
              <a
                href={application.resume}
                download
                className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="p-3 bg-white rounded border border-gray-200 text-gray-500 text-sm">
              No resume attached
            </div>
          )}
        </div>
      </div>
      
      {/* Application Log History Section */}
      <div className="px-6 pb-6">
        <div className="flex items-center mb-4">
          <FiClock className="text-gray-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Activity Log</h2>
        </div>
        
        {logsLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Changed Fields</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 border-b">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b">
                      {log.user_email || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b">
                      {typeof log.changed_fields === 'string' ? (
                        <div>
                          {Object.entries(parseChangedFields(log.changed_fields)).map(([field, values]) => (
                            <div key={field} className="mb-1">
                              <span className="font-medium">{field}</span>: 
                              <span className="text-red-500 line-through px-1">{values.old}</span> → 
                              <span className="text-green-500 px-1">{values.new}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        log.changed_fields
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
            No activity logs found for this application.
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button 
          onClick={handleDelete} 
          className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 flex items-center"
        >
          <FiTrash2 className="mr-2" />
          Delete
        </button>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/dashboard/jobapplication')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiSave className="mr-2" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditJobApplication;