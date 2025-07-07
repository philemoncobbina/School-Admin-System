import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobPostService } from '../../Services/jobPostService';
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
  PenLine
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button'; 

const JobPostsTable = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = activeTab === 'draft' 
        ? await JobPostService.getDraftPosts()
        : await JobPostService.getAllPosts();
      setPosts(data);
      setFilteredPosts(data);
    } catch (err) {
      setError('Failed to load job posts. Please try again later.');
      console.error('Error fetching job posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  useEffect(() => {
    let result = [...posts];
    
    // Apply status filter
    if (statusFilter !== '') {
      result = result.filter(post => post.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter((post) =>
        `${post.title} ${post.reference_number} ${post.location}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredPosts(result);
  }, [searchTerm, posts, sortConfig, statusFilter]);

  const handlePublish = async (id) => {
    try {
      await JobPostService.publishPost(id);
      fetchPosts();
    } catch (err) {
      setError('Failed to publish post. Please try again later.');
      console.error('Error publishing post:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      await JobPostService.deletePost(id);
      setPosts((prevPosts) => prevPosts.filter(post => post.id !== id));
    } catch (err) {
      setError('Failed to delete job post. Please try again later.');
      console.error('Error deleting job post:', err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (postId) => {
    navigate(`/dashboard/jobpost/${postId}/edit`);
  };

  const handleAddJobPost = () => {
    navigate('/dashboard/jobpost/new');
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

  // Get unique statuses for the filter dropdown
  const statusOptions = [...new Set(posts.map(post => post.status))].filter(Boolean);

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'PUBLISHED':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'DRAFT':
          return 'bg-gray-50 text-gray-700 border-gray-200';
        case 'SCHEDULED':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'PUBLISHED':
          return <CheckCircle className="w-4 h-4 mr-1 text-green-500" />;
        case 'SCHEDULED':
          return <Clock className="w-4 h-4 mr-1 text-blue-500" />;
        case 'DRAFT':
          return <PenLine className="w-4 h-4 mr-1 text-gray-500" />;
        default:
          return <PenLine className="w-4 h-4 mr-1 text-gray-500" />;
      }
    };

    const displayStatus = status.charAt(0) + status.slice(1).toLowerCase();

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(status)}`}>
        {getStatusIcon(status)}
        {displayStatus}
      </span>
    );
  };

  // Actions Popover component
  const ActionsPopover = ({ post }) => {
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
              onClick={() => handleEdit(post.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileEdit className="h-4 w-4" /> Edit
            </button>
            
            {post.status === 'DRAFT' && (
              <button
                onClick={() => handlePublish(post.id)}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <CheckCircle className="h-4 w-4" /> Publish
              </button>
            )}
            
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this job post? This action cannot be undone.')) {
                  handleDelete(post.id);
                }
              }}
              disabled={isDeleting && deleteId === post.id}
              className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="text-red-400 h-4 w-4" /> 
              {isDeleting && deleteId === post.id ? 'Deleting...' : 'Delete'}
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
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No job posts found</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {searchTerm || statusFilter ? 
          "We couldn't find any job posts matching your search criteria." : 
          activeTab === 'draft' ? "You don't have any draft job posts yet." : "There are currently no job posts in the system."}
      </p>
      {(searchTerm || statusFilter) && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 mb-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
        </button>
      )}
     <Link to="/dashboard/jobpost/new">



<Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">



  <PlusCircle className="w-4 h-4 mr-2" />



  Create New Book List



</Button>



</Link>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Loading job posts...</p>
    </div>
  );

  return (
    <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Posts</h1>
        <Link to="/dashboard/jobpost/new">



          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">



            <PlusCircle className="w-4 h-4 mr-2" />



            Create New Job Post



          </Button>



        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Job Posts
              <span className="ml-2 text-sm font-medium text-gray-500">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'record' : 'records'}
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
                  All Job Posts
                </button>
                <button
                  onClick={() => setActiveTab('draft')}
                  className={`mr-8 py-4 px-1 ${
                    activeTab === 'draft'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Drafts
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
              placeholder="Search job posts..."
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
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
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
        ) : filteredPosts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('reference_number')}
                  >
                    <div className="flex items-center">
                      Ref. Number {getSortIcon('reference_number')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center">
                      Title {getSortIcon('title')}
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
                    onClick={() => requestSort('location')}
                  >
                    <div className="flex items-center">
                      Location {getSortIcon('location')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created At {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Applications
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr 
                    key={post.id} 
                    className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div className="relative">
                        {post.applications_count > 0 && (
                          <span className="absolute -top-2 right-0 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {Math.round(post.applications_count)}
                          </span>
                        )}
                        <span className="block pt-2">{post.reference_number}</span>
                      </div>
                    </td>
                    <td 
                      onClick={() => handleEdit(post.id)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                    >
                      {post.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {post.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {Math.round(post.applications_count) || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsPopover post={post} />
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

export default JobPostsTable;