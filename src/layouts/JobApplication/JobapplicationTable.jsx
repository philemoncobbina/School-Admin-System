import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobApplicationService } from '../../Services/Jobapplication';
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  PlusCircle,
  RefreshCw,
  FileEdit,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  X,
  UserCheck
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';

const JobApplicationsTable = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [educationFilter, setEducationFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let data;
      
      if (activeTab === 'pending') {
        data = await jobApplicationService.getMyApplications();
        data = data.filter(app => app.status === 'PENDING');
      } else {
        data = await jobApplicationService.getMyApplications();
      }
      
      setApplications(data);
      setFilteredApplications(data);
    } catch (err) {
      setError('Failed to load applications. Please try again later.');
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  useEffect(() => {
    let result = [...applications];
    
    // Apply status filter
    if (statusFilter !== '') {
      result = result.filter(app => app.status === statusFilter);
    }
    
    // Apply education filter
    if (educationFilter !== '') {
      result = result.filter(app => app.educational_level === educationFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(app => 
        app.job_title.toLowerCase().includes(lowercasedTerm) ||
        app.job_reference_number.toLowerCase().includes(lowercasedTerm) ||
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(lowercasedTerm) ||
        app.email.toLowerCase().includes(lowercasedTerm) ||
        app.status.toLowerCase().includes(lowercasedTerm) ||
        app.educational_level.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Special case for name sorting
        if (sortConfig.key === 'name') {
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredApplications(result);
  }, [searchTerm, applications, sortConfig, statusFilter, educationFilter]);

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      await jobApplicationService.deleteApplication(id);
      setApplications((prevApplications) => prevApplications.filter(app => app.id !== id));
    } catch (err) {
      setError('Failed to delete application. Please try again later.');
      console.error('Error deleting application:', err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (applicationId) => {
    navigate(`/dashboard/jobapplication/edit/${applicationId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM d, yyyy, h:mm a');
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (name) => {
    if (sortConfig.key !== name) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Get unique statuses and education levels for filters
  const statusOptions = [...new Set(applications.map(app => app.status))].filter(Boolean);
  const educationOptions = [...new Set(applications.map(app => app.educational_level))].filter(Boolean);

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'HIRED':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'PENDING':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'SHORTLISTED':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'REJECTED':
          return 'bg-red-50 text-red-700 border-red-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'HIRED':
          return <UserCheck className="w-4 h-4 mr-1 text-green-500" />;
        case 'SHORTLISTED':
          return <CheckCircle className="w-4 h-4 mr-1 text-blue-500" />;
        case 'PENDING':
          return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
        case 'REJECTED':
          return <X className="w-4 h-4 mr-1 text-red-500" />;
        default:
          return <Clock className="w-4 h-4 mr-1 text-gray-500" />;
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(status)}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatEducationLevel = (level) => {
    return level.replace(/_/g, ' ');
  };

  // Actions Popover component
  const ActionsPopover = ({ application }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-0 bg-white" align="end">
          <div className="py-1">
            <button
              onClick={() => handleEdit(application.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileEdit className="h-4 w-4" /> Edit
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
                  handleDelete(application.id);
                }
              }}
              disabled={isDeleting && deleteId === application.id}
              className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="text-red-400 h-4 w-4" /> 
              {isDeleting && deleteId === application.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-gray-50 p-6 rounded-full mb-5">
        <Search className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications found</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {searchTerm || statusFilter || educationFilter ? 
          "We couldn't find any applications matching your search criteria." : 
          activeTab === 'pending' ? "There are currently no pending applications." : "There are currently no applications in the system."}
      </p>
      {(searchTerm || statusFilter || educationFilter) && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
            setEducationFilter('');
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 mb-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Loading applications...</p>
    </div>
  );

  return (
    <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Applications</h1>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Applications
              <span className="ml-2 text-sm font-medium text-gray-500">
                {filteredApplications.length} {filteredApplications.length === 1 ? 'record' : 'records'}
              </span>
            </h2>
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'all'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Applications
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'pending'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
            </div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={educationFilter}
                onChange={(e) => setEducationFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                <option value="">All Education Levels</option>
                {educationOptions.map(level => (
                  <option key={level} value={level}>{formatEducationLevel(level)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : filteredApplications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('job_title')}
                  >
                    <div className="flex items-center">
                      Job Title {getSortIcon('job_title')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('job_reference_number')}
                  >
                    <div className="flex items-center">
                      Reference Number {getSortIcon('job_reference_number')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Name {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('applied_at')}
                  >
                    <div className="flex items-center">
                      Applied Date {getSortIcon('applied_at')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('educational_level')}
                  >
                    <div className="flex items-center">
                      Education {getSortIcon('educational_level')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr 
                    key={application.id} 
                    className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                      onClick={() => handleEdit(application.id)}
                    >
                      {application.job_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {application.job_reference_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {application.first_name} {application.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {application.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(application.applied_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatEducationLevel(application.educational_level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsPopover application={application} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationsTable;