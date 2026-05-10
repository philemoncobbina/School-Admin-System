import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { JobPostService } from '../../Services/jobPostService';
import {
  Search, MoreHorizontal, Trash2, PlusCircle, RefreshCw,
  FileEdit, Filter, ChevronDown, ChevronUp, CheckCircle, Clock, PenLine
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
  PUBLISHED: { badge: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> },
  SCHEDULED: { badge: 'bg-blue-50 text-blue-700 border-blue-200',  icon: <Clock className="w-4 h-4 mr-1 text-blue-500" /> },
  DRAFT:     { badge: 'bg-gray-50 text-gray-700 border-gray-200',  icon: <PenLine className="w-4 h-4 mr-1 text-gray-500" /> },
};

const StatusBadge = ({ status }) => {
  const { badge, icon } = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge}`}>
      {icon}{label}
    </span>
  );
};

const JobPostsTable = () => {
  const navigate = useNavigate();
  const [posts, setPosts]               = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('all');
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId]     = useState(null);
  const [sortConfig, setSortConfig]     = useState({ key: null, direction: null });

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = activeTab === 'draft'
        ? await JobPostService.getDraftPosts()
        : await JobPostService.getAllPosts();
      setPosts(data);
    } catch {
      setError('Failed to load job posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [activeTab]);

  useEffect(() => {
    let result = [...posts];
    if (statusFilter) result = result.filter(p => p.status === statusFilter);
    if (searchTerm)   result = result.filter(p =>
      `${p.title} ${p.reference_number} ${p.location}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ?  1 : -1;
        return 0;
      });
    }
    setFilteredPosts(result);
  }, [searchTerm, posts, sortConfig, statusFilter]);

  const handlePublish = async (id) => {
    try {
      await JobPostService.publishPost(id);
      fetchPosts();
    } catch {
      setError('Failed to publish post. Please try again later.');
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await JobPostService.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete job post. Please try again later.');
    } finally {
      setDeletingId(null);
    }
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const SortIcon = ({ name }) => {
    if (sortConfig.key !== name) return null;
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const SortableTh = ({ label, sortKey, className = '' }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center">{label}<SortIcon name={sortKey} /></div>
    </th>
  );

  const ActionsPopover = ({ post }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-0 bg-white" align="end">
        <div className="py-1">
          <button
            onClick={() => navigate(`/dashboard/jobpost/${post.id}/edit`)}
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
            onClick={() => window.confirm('Are you sure you want to delete this job post? This action cannot be undone.') && handleDelete(post.id)}
            disabled={deletingId === post.id}
            className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="text-red-400 h-4 w-4" />
            {deletingId === post.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const statusOptions = [...new Set(posts.map(p => p.status))].filter(Boolean);

  return (
    <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Job Posts</h1>
        <Link to="/dashboard/jobpost/new">
          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">
            <PlusCircle className="w-4 h-4 mr-2" /> Create New Job Post
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Job Posts
            <span className="ml-2 text-sm font-medium text-gray-500">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'record' : 'records'}
            </span>
          </h2>
          <nav className="flex border-b border-gray-200 -mb-px">
            {['all', 'draft'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-8 py-4 px-1 capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? 'All Job Posts' : 'Drafts'}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search job posts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading job posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-5">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No job posts found</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              {searchTerm || statusFilter
                ? "We couldn't find any job posts matching your search criteria."
                : activeTab === 'draft'
                  ? "You don't have any draft job posts yet."
                  : "There are currently no job posts in the system."}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 mb-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
              </button>
            )}
            <Link to="/dashboard/jobpost/new">
              <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">
                <PlusCircle className="w-4 h-4 mr-2" /> Create New Job Post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <SortableTh label="Ref. Number"  sortKey="reference_number" />
                  <SortableTh label="Title"        sortKey="title" />
                  <SortableTh label="Status"       sortKey="status" />
                  <SortableTh label="Location"     sortKey="location" />
                  <SortableTh label="Created At"   sortKey="created_at" />
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.id} className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {post.reference_number}
                    </td>
                    <td
                      onClick={() => navigate(`/dashboard/jobpost/${post.id}/edit`)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                    >
                      {post.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {post.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.created_at ? format(new Date(post.created_at), 'MMMM d, yyyy, h:mm a') : ''}
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