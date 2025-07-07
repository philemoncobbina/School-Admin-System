import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../Services/ResultService';
import { CLASS_OPTIONS } from '../../services/booklistService';
import { PlusCircle, Edit, Trash2, Search, X, AlertTriangle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';

// Simplified UI Components
const Button = ({ children, onClick, variant = 'primary', disabled, className = '', ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded ${
      variant === 'outline' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' :
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
      variant === 'secondary' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' :
      'bg-indigo-600 text-white hover:bg-indigo-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Select = ({ value, onChange, children, disabled, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full p-2 border border-gray-300 rounded bg-white"
  >
    <option value="">{placeholder}</option>
    {children}
  </select>
);

const Input = ({ value, onChange, placeholder, disabled, className = '', type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full p-2 border border-gray-300 rounded ${className}`}
  />
);

const Alert = ({ type, children }) => (
  <div className={`p-4 rounded mb-4 ${
    type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
    type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
    'bg-green-50 border border-green-200 text-green-800'
  }`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${
    variant === 'published' ? 'bg-green-100 text-green-800' :
    variant === 'draft' ? 'bg-yellow-100 text-yellow-800' :
    variant === 'scheduled' ? 'bg-blue-100 text-blue-800' :
    'bg-gray-100 text-gray-800'
  }`}>
    {children}
  </span>
);

// Constants
const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PUBLISHED', label: 'Published' }
];

const ResultsTableView = () => {
  // State Management
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('overall_position');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Modal States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [bulkUpdateResponse, setBulkUpdateResponse] = useState(null);
  const [showBulkResponseModal, setShowBulkResponseModal] = useState(false);

  // Fetch results when class or term changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedClass || !selectedTerm) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await apiService.results.getClassResults(selectedClass, selectedTerm);
        setResults(data || []);
      } catch (err) {
        setError('Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedClass, selectedTerm]);

  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort results
  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = results.filter(result => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        (result.student_name || 'Unknown Student').toLowerCase().includes(searchLower) ||
        (result.status || '').toLowerCase().includes(searchLower) ||
        (result.overall_position?.toString() || '').includes(searchQuery)
      );
    });
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'overall_position':
          aValue = a.overall_position;
          bValue = b.overall_position;
          if (aValue && bValue) return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          if (aValue && !bValue) return sortDirection === 'asc' ? -1 : 1;
          if (!aValue && bValue) return sortDirection === 'asc' ? 1 : -1;
          aValue = a.student_name || 'Unknown Student';
          bValue = b.student_name || 'Unknown Student';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        default:
          aValue = a[sortColumn === 'student_name' ? 'student_name' : 'status'] || (sortColumn === 'student_name' ? 'Unknown Student' : '');
          bValue = b[sortColumn === 'student_name' ? 'student_name' : 'status'] || (sortColumn === 'student_name' ? 'Unknown Student' : '');
      }
      
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }, [results, searchQuery, sortColumn, sortDirection]);

  // Handle bulk update
  const handleBulkUpdate = async () => {
    if (bulkStatus === 'SCHEDULED' && !scheduledDate) {
      setError('Scheduled date is required when status is SCHEDULED');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = bulkStatus === 'SCHEDULED' 
        ? await apiService.results.bulkUpdateStatus(selectedClass, selectedTerm, bulkStatus, scheduledDate)
        : await apiService.results.bulkUpdateStatus(selectedClass, selectedTerm, bulkStatus);
      
      setBulkUpdateResponse(response);
      setShowBulkResponseModal(true);
      setShowBulkModal(false);
      setBulkStatus('DRAFT');
      setScheduledDate('');
      
      const hasNoErrors = !response.error && 
        (!response.missing_results || response.missing_results.length === 0) && 
        (!response.incomplete_results || response.incomplete_results.length === 0);
      
      if (hasNoErrors) {
        setSuccess('All results updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
      
      // Refresh data
      const data = await apiService.results.getClassResults(selectedClass, selectedTerm);
      setResults(data || []);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        setBulkUpdateResponse(errorData);
        setShowBulkResponseModal(true);
        setShowBulkModal(false);
        setBulkStatus('DRAFT');
        setScheduledDate('');
      } else {
        setError('Failed to update results');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      await apiService.results.delete(deleteId);
      setSuccess('Result deleted successfully');
      setDeleteId(null);
      const data = await apiService.results.getClassResults(selectedClass, selectedTerm);
      setResults(data || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete result');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  const getStatusBadge = (status) => <Badge variant={status.toLowerCase()}>{status}</Badge>;
  const getSortIcon = (column) => sortColumn === column ? 
    (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />) : null;
  const getMinDate = () => new Date().toISOString().split('T')[0];

  // Render bulk update response
  const renderBulkUpdateResponse = () => {
    if (!bulkUpdateResponse) return null;

    const hasErrors = bulkUpdateResponse.error || 
      (bulkUpdateResponse.missing_results && bulkUpdateResponse.missing_results.length > 0) ||
      (bulkUpdateResponse.incomplete_results && bulkUpdateResponse.incomplete_results.length > 0);

    return (
      <div className="space-y-4">
        {bulkUpdateResponse.error && (
          <Alert type="error">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {bulkUpdateResponse.error}
          </Alert>
        )}

        {bulkUpdateResponse.updated_count && (
          <Alert type="success">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Successfully updated {bulkUpdateResponse.updated_count} result(s)
          </Alert>
        )}

        {bulkUpdateResponse.missing_results && bulkUpdateResponse.missing_results.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h4 className="font-semibold text-red-800 mb-2">
              Missing Results ({bulkUpdateResponse.missing_results.length})
            </h4>
            <div className="space-y-2">
              {bulkUpdateResponse.missing_results.map((missing, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                  <strong>{missing.student_name}</strong> (ID: {missing.student_id})
                  <br />
                  <span className="text-red-600">{missing.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bulkUpdateResponse.incomplete_results && bulkUpdateResponse.incomplete_results.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Incomplete Results ({bulkUpdateResponse.incomplete_results.length})
            </h4>
            <div className="space-y-2">
              {bulkUpdateResponse.incomplete_results.map((incomplete, index) => (
                <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                  <strong>{incomplete.student_name}</strong> (ID: {incomplete.student_id})
                  <br />
                  <span className="text-yellow-600">{incomplete.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasErrors && (
          <Alert type="success">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            All results have been updated successfully!
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-9xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Results</h1>
          <p className="text-gray-600">View and manage student assessment records</p>
        </div>
        <Link to="/dashboard/results-management/create-result/">
          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all flex items-center">
            <PlusCircle className="w-4 h-4 mr-2" />
            <span>Create Result</span>
          </Button>
        </Link>
      </div>

        {/* Alerts */}
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <Select value={selectedClass} onChange={setSelectedClass} placeholder="Select Class">
              {CLASS_OPTIONS.map(cls => (
                <option key={cls.value} value={cls.value}>{cls.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
            <Select value={selectedTerm} onChange={setSelectedTerm} placeholder="Select Term" disabled={!selectedClass}>
              {TERMS.map(term => (
                <option key={term.value} value={term.value}>{term.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, status, or position..."
                className="pl-10"
                disabled={!selectedClass || !selectedTerm}
              />
            </div>
          </div>
        </div>
        
        {selectedClass && selectedTerm && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowBulkModal(true)} disabled={loading}>
              Bulk Update Status
            </Button>
            {searchQuery && (
              <Button variant="secondary" onClick={() => setSearchQuery('')}>
                <X className="w-4 h-4 mr-2" />
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results Table */}
      {selectedClass && selectedTerm && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {selectedClass} - {TERMS.find(t => t.value === selectedTerm)?.label} Results
            </h3>
            <p className="text-sm text-gray-600">
              {filteredAndSortedResults.length} of {results.length} result{results.length !== 1 ? 's' : ''} shown
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : filteredAndSortedResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'overall_position', label: 'Position' },
                      { key: 'student_name', label: 'Student' },
                      { key: 'status', label: 'Status' },
                      { key: 'created_at', label: 'Created' }
                    ].map(({ key, label }) => (
                      <th 
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(key)}
                      >
                        {label} {getSortIcon(key)}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.overall_position ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                            {result.overall_position}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.student_name || 'Unknown Student'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(result.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/dashboard/results-management/edit-result/${result.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(result.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {results.length === 0 ? 'No results found' : 'No results match your search'}
              </p>
              {results.length === 0 ? (
                <Link
                  to="/dashboard/results-management/create-result/"
                  className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
                >
                  Create a new result
                </Link>
              ) : (
                <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Bulk Update Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <Select value={bulkStatus} onChange={setBulkStatus}>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </Select>
              </div>

              {bulkStatus === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    min={getMinDate() + 'T00:00'}
                    className={!scheduledDate ? 'border-red-300' : ''}
                  />
                  {!scheduledDate && (
                    <p className="text-red-500 text-xs mt-1">
                      Scheduled date and time is required when status is SCHEDULED
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  This will update the status for all results in <strong>{selectedClass}</strong> - <strong>{TERMS.find(t => t.value === selectedTerm)?.label}</strong>.
                  {bulkStatus === 'SCHEDULED' && scheduledDate && (
                    <>
                      <br />
                      Results will be scheduled for: <strong>{new Date(scheduledDate).toLocaleString()}</strong>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => { setShowBulkModal(false); setBulkStatus('DRAFT'); setScheduledDate(''); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpdate} 
                disabled={loading || (bulkStatus === 'SCHEDULED' && !scheduledDate)}
              >
                {loading ? 'Updating...' : `Update All (${results.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Response Modal */}
      {showBulkResponseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Bulk Update Results</h3>
            {renderBulkUpdateResponse()}
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowBulkResponseModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this result? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTableView;