import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobPostService, JobPostLogService } from '../../Services/jobPostService';
import { FaArrowLeft } from 'react-icons/fa';
import { FiSave, FiTrash2, FiClock, FiCheck, FiVolume2, FiCalendar, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

export default function JobPostEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [logs, setLogs] = useState([]);
  
  const [post, setPost] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
    status: 'DRAFT',
    scheduled_date: null
  });

  useEffect(() => {
    if (id) {
      loadPost();
      loadJobPostLogs();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await JobPostService.getPostById(parseInt(id));
      setPost(data);
      if (data.scheduled_date) {
        setScheduleDate(formatDateForInput(data.scheduled_date));
      }
    } catch (err) {
      setError('Failed to load job post');
    } finally {
      setLoading(false);
    }
  };

  const loadJobPostLogs = async () => {
    if (!id) return;
    
    try {
      setLogsLoading(true);
      const logsData = await JobPostLogService.getLogsForJobPost(parseInt(id));
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load job post logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await JobPostService.updatePost(parseInt(id), post);
      } else {
        await JobPostService.createPost(post);
      }
      // Reload logs after saving to get the latest
      if (id) {
        loadJobPostLogs();
      }
      navigate('/dashboard/jobpost');
    } catch (err) {
      setError('Failed to save job post');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await JobPostService.deletePost(parseInt(id));
        navigate('/dashboard/jobpost');
      } catch (err) {
        setError('Failed to delete post');
      }
    }
  };

  const handleStatusChange = async (action) => {
    try {
      switch (action) {
        case 'publish':
          await JobPostService.publishPost(parseInt(id));
          break;
        case 'mute':
          await JobPostService.updatePost(parseInt(id), { 
            ...post, 
            status: 'DRAFT', 
            scheduled_date: null 
          });
          break;
        case 'schedule':
          await JobPostService.schedulePost(parseInt(id), { scheduled_date: scheduleDate });
          setShowScheduleModal(false);
          break;
        default:
          return;
      }
      loadPost();
      loadJobPostLogs(); // Reload logs after status change
    } catch (err) {
      setError(`Failed to ${action} post`);
    }
  };

  const getActionTypeLabel = (actionType) => {
    const labels = {
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'STATUS_CHANGE': 'Status Changed',
      'PUBLISH': 'Published',
      'SCHEDULE': 'Scheduled'
    };
    return labels[actionType] || actionType;
  };

  const getActionTypeColor = (actionType) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'STATUS_CHANGE': 'bg-yellow-100 text-yellow-800',
      'PUBLISH': 'bg-purple-100 text-purple-800',
      'SCHEDULE': 'bg-indigo-100 text-indigo-800'
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    PUBLISHED: 'bg-green-100 text-green-800'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            className="text-blue-500 flex items-center space-x-2 hover:text-blue-700 transition duration-200"
            onClick={() => navigate('/dashboard/jobpost')}
          >
            <FaArrowLeft />
            <span className="text-lg font-medium">Back to Job Posts</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {id ? 'Edit Job Post' : 'Create New Job Post'}
          </h1>
        </div>
        
        {/* Status Badge */}
        {post.status && (
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[post.status]}`}>
              {post.status}
              {post.scheduled_date && (
                <span className="ml-2">
                  {format(new Date(post.scheduled_date), 'MMM dd, yyyy hh:mm a')}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="m-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={post.title}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={post.location}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
            <input
              type="text"
              name="salary_range"
              value={post.salary_range}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={post.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea
              name="requirements"
              value={post.requirements}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
        {id && (
          <button 
            onClick={handleDelete} 
            className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 flex items-center"
          >
            <FiTrash2 className="mr-2" />
            Delete
          </button>
        )}
        
        <div className="flex space-x-3">
          {post.status === 'DRAFT' && id && (
            <>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
              >
                <FiClock className="mr-2" />
                Schedule
              </button>
              <button
                onClick={() => handleStatusChange('publish')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FiCheck className="mr-2" />
                Publish
              </button>
            </>
          )}
          
          {post.status === 'PUBLISHED' && (
            <button
              onClick={() => handleStatusChange('mute')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
            >
              <FiVolume2 className="mr-2" />
              Mute Post
            </button>
          )}
          
          {post.status === 'SCHEDULED' && (
            <>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
              >
                <FiCalendar className="mr-2" />
                Reschedule
              </button>
              <button
                onClick={() => handleStatusChange('mute')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
              >
                <FiVolume2 className="mr-2" />
                Cancel
              </button>
            </>
          )}
          
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiSave className="mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Job Post Logs Section */}
      {id && (
        <div className="p-6 pt-0">
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FiInfo className="mr-2" />
              Activity Log
            </h2>
            
            {logsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activity logs available for this job post.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changed Fields
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                            {getActionTypeLabel(log.action_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.changed_fields}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {post.status === 'SCHEDULED' ? 'Reschedule Post' : 'Schedule Post'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange('schedule')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FiCalendar className="mr-2" />
                {post.status === 'SCHEDULED' ? 'Reschedule' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}