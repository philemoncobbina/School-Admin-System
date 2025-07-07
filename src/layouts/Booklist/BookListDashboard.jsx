// src/components/booklist/BookListDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookLists, getDraftBookLists, deleteBookList, CLASS_OPTIONS } from '../../services/booklistService';
import { 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  PlusCircle,
  RefreshCw,
  FileEdit,
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Clock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const BookListDashboard = () => {
  const navigate = useNavigate();
  const [bookLists, setBookLists] = useState([]);
  const [filteredBookLists, setFilteredBookLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchBookLists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = activeTab === 'draft' ? await getDraftBookLists() : await getBookLists();
      setBookLists(data);
      setFilteredBookLists(data);
    } catch (err) {
      setError('Failed to load book lists. Please try again later.');
      console.error('Error fetching book lists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookLists();
  }, [activeTab]);

  useEffect(() => {
    let result = [...bookLists];
    
    // Apply class filter
    if (classFilter !== '') {
      result = result.filter(bookList => bookList.class_name === classFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter((bookList) =>
        `${bookList.title} ${bookList.academic_year}`
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
    
    setFilteredBookLists(result);
  }, [searchTerm, bookLists, sortConfig, classFilter]);

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      await deleteBookList(id);
      setBookLists((prevBookLists) => prevBookLists.filter(list => list.id !== id));
    } catch (err) {
      setError('Failed to delete book list. Please try again later.');
      console.error('Error deleting book list:', err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM d, yyyy, h:mm a');
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

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

  const getClassDisplayName = (className) => 
    CLASS_OPTIONS.find(c => c.value === className)?.label || className;

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'published':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'draft':
          return 'bg-gray-50 text-gray-700 border-gray-200';
        case 'scheduled':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'published':
          return <BookOpen className="w-4 h-4 mr-1 text-green-500" />;
        case 'scheduled':
          return <Clock className="w-4 h-4 mr-1 text-blue-500" />;
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

  // Actions Popover component
  const ActionsPopover = ({ bookList }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-0 bg-white" align="end">
          <div className="py-1">
            <Link
              to={`/dashboard/booklists/edit/${bookList.id}`}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileEdit className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this book list? This action cannot be undone.')) {
                  handleDelete(bookList.id);
                }
              }}
              disabled={isDeleting && deleteId === bookList.id}
              className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="text-red-400 h-4 w-4" /> 
              {isDeleting && deleteId === bookList.id ? 'Deleting...' : 'Delete'}
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
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No book lists found</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {searchTerm || classFilter ? 
          "We couldn't find any book lists matching your search criteria." : 
          activeTab === 'draft' ? "You don't have any draft book lists yet." : "There are currently no book lists in the system."}
      </p>
      {(searchTerm || classFilter) && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setClassFilter('');
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 mb-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
        </button>
      )}
      <button
        onClick={() => navigate('/dashboard/create-booklist')}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        <PlusCircle className="w-4 h-4 mr-2" /> Create New Book List
      </button>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600 font-medium">Loading book lists...</p>
    </div>
  );

  return (
    <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Book Lists</h1>
        <Link to="/dashboard/booklists/create-booklist">



          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">



            <PlusCircle className="w-4 h-4 mr-2" />



            Create New Book List



          </Button>



        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Book Lists
              <span className="ml-2 text-sm font-medium text-gray-500">
                {filteredBookLists.length} {filteredBookLists.length === 1 ? 'record' : 'records'}
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
                  All Book Lists
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
              placeholder="Search booklists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
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
        ) : filteredBookLists.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
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
                    onClick={() => requestSort('class_name')}
                  >
                    <div className="flex items-center">
                      Class {getSortIcon('class_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('academic_year')}
                  >
                    <div className="flex items-center">
                      Academic Year {getSortIcon('academic_year')}
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
                      Items
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('calculated_total_price')}
                  >
                    <div className="flex items-center">
                      Total Price {getSortIcon('calculated_total_price')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookLists.map((bookList) => (
                  <tr 
                    key={bookList.id} 
                    className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <td 
                      onClick={() => navigate(`/dashboard/booklists/edit/${bookList.id}`)}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                    >
                      {bookList.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {getClassDisplayName(bookList.class_name)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {bookList.academic_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bookList.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bookList.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {bookList.items?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatCurrency(bookList.calculated_total_price || bookList.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsPopover bookList={bookList} />
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

export default BookListDashboard;