import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../../Services/UserService';
import { fetchBookings, fetchReservationLogs, deleteBooking } from '../../Services/BookingService';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import NoAccessModal from './NoAccessModal';
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
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  Eye
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const Reservation = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNoAccessModalOpen, setIsNoAccessModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('');

  const getUserRole = async () => {
    try {
      const userDetails = await UserService.getUserDetails();
      setUserRole(userDetails.role);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details. Please try again later.');
    }
  };

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBookings();
      const bookingsWithLogs = await Promise.all(
        data.map(async (booking) => {
          try {
            const logs = await fetchReservationLogs(booking.id);
            return { ...booking, logs };
          } catch (err) {
            console.error(`Error fetching logs for booking ${booking.id}:`, err);
            return { ...booking, logs: [] };
          }
        })
      );
      setBookings(bookingsWithLogs);
      setFilteredBookings(bookingsWithLogs);
    } catch (err) {
      setError('Failed to load reservations. Please try again later.');
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getUserRole();
    fetchReservations();
  }, [activeTab]);

  useEffect(() => {
    let result = [...bookings];
    
    // Apply status filter
    if (statusFilter !== '') {
      result = result.filter(booking => booking.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter((booking) =>
        `${booking.full_name} ${booking.email} ${booking.department}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'booking_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
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
    
    setFilteredBookings(result);
  }, [searchTerm, bookings, sortConfig, statusFilter]);

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      await deleteBooking(id);
      setBookings((prevBookings) => prevBookings.filter(booking => booking.id !== id));
      setIsDeleteModalOpen(false);
      setSelectedBooking(null);
    } catch (err) {
      setError('Failed to delete reservation. Please try again later.');
      console.error('Error deleting booking:', err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
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

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'Confirmed':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'Pending':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'Cancelled':
          return 'bg-red-50 text-red-700 border-red-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Confirmed':
          return <BookOpen className="w-3 h-3 mr-1 text-green-500" />;
        case 'Pending':
          return <Clock className="w-3 h-3 mr-1 text-yellow-500" />;
        case 'Cancelled':
          return <Calendar className="w-3 h-3 mr-1 text-red-500" />;
        default:
          return <Clock className="w-3 h-3 mr-1 text-gray-500" />;
      }
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(status)}`}>
        {getStatusIcon(status)}
        <span className="hidden sm:inline">{status}</span>
        <span className="sm:hidden">{status.charAt(0)}</span>
      </span>
    );
  };

  const openDeleteModal = (booking) => {
    if (userRole === 'principal') {
      setSelectedBooking(booking);
      setIsDeleteModalOpen(true);
    } else {
      setIsNoAccessModalOpen(true);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedBooking(null);
  };

  const closeNoAccessModal = () => {
    setIsNoAccessModalOpen(false);
  };

  // Actions Popover component
  const ActionsPopover = ({ booking }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors">
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-0 bg-white" align="end">
          <div className="py-1">
            <button
              onClick={() => navigate(`/dashboard/reservations/edit/${booking.id}`)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileEdit className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
                  openDeleteModal(booking);
                }
              }}
              disabled={isDeleting && deleteId === booking.id}
              className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="text-red-400 h-4 w-4" /> 
              {isDeleting && deleteId === booking.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-50 p-4 sm:p-6 rounded-full mb-4 sm:mb-5">
        <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No reservations found</h3>
      <p className="text-sm sm:text-base text-gray-500 max-w-sm mb-4 sm:mb-6">
        {searchTerm || statusFilter ? 
          "We couldn't find any reservations matching your search criteria." : 
          "There are currently no reservations in the system."}
      </p>
      {(searchTerm || statusFilter) && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
          }}
          className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 mb-4 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm sm:text-base text-gray-600 font-medium">Loading reservations...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-9xl mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Reservations</h1>
      </div>

      <div className="bg-white shadow-sm sm:shadow-md rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Reservations
              <span className="ml-2 text-xs sm:text-sm font-medium text-gray-500">
                {filteredBookings.length} {filteredBookings.length === 1 ? 'record' : 'records'}
              </span>
            </h2>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 sm:py-2.5 pl-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 sm:py-2.5 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[120px]"
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 m-3 sm:m-4 rounded-md" role="alert">
            <p className="font-medium text-sm sm:text-base">{error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : filteredBookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                    onClick={() => requestSort('full_name')}
                  >
                    <div className="flex items-center">
                      Full Name {getSortIcon('full_name')}
                    </div>
                  </th>
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[160px]"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px]"
                    onClick={() => requestSort('phone')}
                  >
                    <div className="flex items-center">
                      Phone {getSortIcon('phone')}
                    </div>
                  </th>
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                    onClick={() => requestSort('booking_date')}
                  >
                    <div className="flex items-center">
                      Booking Date {getSortIcon('booking_date')}
                    </div>
                  </th>
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                    onClick={() => requestSort('department')}
                  >
                    <div className="flex items-center">
                      Department {getSortIcon('department')}
                    </div>
                  </th>
                  <th 
                    className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px]"
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                    Updated By
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[140px]">
                    Updated Date
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px] sticky right-0 bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const latestLog = booking.logs && booking.logs.length > 0 ? booking.logs[booking.logs.length - 1] : null;
                  return (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <td 
                        onClick={() => navigate(`/dashboard/reservations/edit/${booking.id}`)}
                        className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                      >
                        <div className="truncate max-w-[120px]" title={booking.full_name}>
                          {booking.full_name}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-800">
                        <div className="truncate max-w-[160px]" title={booking.email}>
                          {booking.email}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-800">
                        <div className="truncate max-w-[100px]" title={booking.phone}>
                          {booking.phone}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-800">
                        <div className="whitespace-nowrap">
                          {formatDate(booking.booking_date)}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-800">
                        <div className="truncate max-w-[120px]" title={booking.department}>
                          {booking.department}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        <div className="truncate max-w-[120px]" title={latestLog ? latestLog.user_email : 'N/A'}>
                          {latestLog ? latestLog.user_email : 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        <div className="whitespace-nowrap text-xs sm:text-sm">
                          {latestLog ? formatDateTime(latestLog.timestamp) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm font-medium sticky right-0">
                        <ActionsPopover booking={booking} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDelete(selectedBooking?.id)}
      />
      <NoAccessModal isOpen={isNoAccessModalOpen} onClose={closeNoAccessModal} />
    </div>
  );
};

export default Reservation;