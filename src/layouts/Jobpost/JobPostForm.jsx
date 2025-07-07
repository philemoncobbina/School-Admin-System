import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobPostService } from '../../Services/jobPostService';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const JobPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
  });

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const post = await JobPostService.getPostById(Number(id));
      setFormData({
        title: post.title,
        description: post.description,
        requirements: post.requirements,
        location: post.location,
        salary_range: post.salary_range,
      });
      if (post.scheduled_date) {
        setScheduledDate(post.scheduled_date.slice(0, 16));
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

   // Add the missing handleChange function
   const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleError = (err) => {
    let errorMessage = '';
    
    if (err.response?.data) {
      // Handle structured error responses
      const data = err.response.data;
      if (typeof data === 'object') {
        // Handle field-specific errors
        errorMessage = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
      } else {
        errorMessage = data;
      }
    } else if (err.message) {
      errorMessage = err.message;
    } else {
      errorMessage = 'An unexpected error occurred';
    }
    
    setError(errorMessage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    try {
      setLoading(true);

      if (id) {
        const response = await JobPostService.updatePost(Number(id), formData);
        setSuccessMessage(`Successfully updated job post: ${response.reference_number}`);
      } else {
        const post = await JobPostService.createPost(formData);
        if (scheduledDate) {
          try {
            await JobPostService.schedulePost(post.id, {
              scheduled_date: new Date(scheduledDate).toISOString()
            });
            setSuccessMessage(`Successfully created and scheduled job post: ${post.reference_number}`);
          } catch (scheduleErr) {
            // Handle scheduling error but don't clear the success message for post creation
            handleError(scheduleErr);
            return;
          }
        } else {
          setSuccessMessage(`Successfully created job post: ${post.reference_number}`);
        }
        
        // Navigate after a delay to show the success message
        setTimeout(() => {
          navigate('/dashboard/jobpost');
        }, 3700);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Job Post' : 'Create New Job Post'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details below to {id ? 'update the' : 'create a new'} job posting.
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-6">
            <div className="flex p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-6">
            <div className="flex p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the form remains the same */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ... existing form fields ... */}
          {/* The form fields section remains unchanged */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter job title"
              className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Job Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter detailed job description"
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Enter job requirements"
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Job location"
                className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Salary Range
              </label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g. $50,000 - $70,000"
                className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {!id && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Schedule Publication (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                Leave empty to save as draft
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard/jobpost')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                  {id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                id ? 'Update Post' : 'Create Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostForm;