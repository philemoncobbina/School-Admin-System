import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, deleteTicket } from '../../Services/TicketService';
import UserService from '../../Services/UserService';
import ConfirmationModal from './ConfirmationModal';
import NoAccessModal from './NoAccessModal';
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  RefreshCw,
  FileEdit,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';

const TicketsList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoAccessModal, setShowNoAccessModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [userRole, setUserRole] = useState('');

  const getUserRole = async () => {
    try {
      const userDetails = await UserService.getUserDetails();
      setUserRole(userDetails.role);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const getTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      
      data = await fetchTickets();
      
      if (activeTab === 'pending') {
        data = data.filter(ticket => ticket.status === 'Pending');
      }
      
      setTickets(data);
      setFilteredTickets(data);
    } catch (err) {
      setError('Failed to load tickets. Please try again later.');
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserRole();
    getTickets();
  }, [activeTab]);

  useEffect(() => {
    let result = [...tickets];
    
    // Apply status filter
    if (statusFilter !== '') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    
    // Apply section filter
    if (sectionFilter !== '') {
      result = result.filter(ticket => ticket.section === sectionFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(ticket => 
        ticket.full_name?.toLowerCase().includes(lowercasedTerm) ||
        ticket.TicketID?.toLowerCase().includes(lowercasedTerm) ||
        ticket.email?.toLowerCase().includes(lowercasedTerm) ||
        ticket.phone_number?.toLowerCase().includes(lowercasedTerm) ||
        ticket.section?.toLowerCase().includes(lowercasedTerm) ||
        ticket.status?.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredTickets(result);
  }, [searchTerm, tickets, sortConfig, statusFilter, sectionFilter]);

  const handleEdit = (ticket) => {
    navigate(`/dashboard/tickets/edit/${ticket.id}`);
  };

  const openDeleteModal = (ticket) => {
    if (userRole === 'principal') {
      setTicketToDelete(ticket);
      setShowDeleteModal(true);
    } else {
      setShowNoAccessModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteId(ticketToDelete.id);
      await deleteTicket(ticketToDelete.id);
      setTickets(tickets.filter((ticket) => ticket.id !== ticketToDelete.id));
      setFilteredTickets(filteredTickets.filter((ticket) => ticket.id !== ticketToDelete.id));
      setShowDeleteModal(false);
    } catch (error) {
      setError('Error deleting ticket. Please try again later.');
      console.error('Error deleting ticket:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
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

  // Get unique statuses and sections for filters
  const statusOptions = [...new Set(tickets.map(ticket => ticket.status))].filter(Boolean);
  const sectionOptions = [...new Set(tickets.map(ticket => ticket.section))].filter(Boolean);

  const getStatusBadge = (status) => {
    const getStatusClass = (status) => {
      switch (status) {
        case 'Resolved':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'Pending':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'In Progress':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Closed':
          return 'bg-gray-50 text-gray-700 border-gray-200';
        case 'Urgent':
          return 'bg-red-50 text-red-700 border-red-200';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Resolved':
          return <UserCheck className="w-4 h-4 mr-1 text-green-500" />;
        case 'In Progress':
          return <CheckCircle className="w-4 h-4 mr-1 text-blue-500" />;
        case 'Pending':
          return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
        case 'Closed':
          return <X className="w-4 h-4 mr-1 text-gray-500" />;
        case 'Urgent':
          return <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />;
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
  const ActionsPopover = ({ ticket }) => {
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
              onClick={() => handleEdit(ticket)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileEdit className="h-4 w-4" /> Edit
            </button>
            
            <button
              onClick={() => openDeleteModal(ticket)}
              disabled={isDeleting && deleteId === ticket.id}
              className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="text-red-400 h-4 w-4" /> 
              {isDeleting && deleteId === ticket.id ? 'Deleting...' : 'Delete'}
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
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No tickets found</h3>
      <p className="text-gray-500 max-w-sm mb-6">
        {searchTerm || statusFilter || sectionFilter ? 
          "We couldn't find any tickets matching your search criteria." : 
          activeTab === 'pending' ? "There are currently no pending tickets." : "There are currently no tickets in the system."}
      </p>
      {(searchTerm || statusFilter || sectionFilter) && (
        <button 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
            setSectionFilter('');
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
      <p className="text-gray-600 font-medium">Loading tickets...</p>
    </div>
  );

  return (
    <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Support Tickets</h1>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Tickets
              <span className="ml-2 text-sm font-medium text-gray-500">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'record' : 'records'}
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
                  All Tickets
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
              placeholder="Search tickets..."
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
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none pr-8"
              >
                <option value="">All Sections</option>
                {sectionOptions.map(section => (
                  <option key={section} value={section}>{section}</option>
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

        {loading ? (
          <LoadingState />
        ) : filteredTickets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('TicketID')}
                  >
                    <div className="flex items-center">
                      Ticket ID {getSortIcon('TicketID')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('full_name')}
                  >
                    <div className="flex items-center">
                      Full Name {getSortIcon('full_name')}
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
                    onClick={() => requestSort('phone_number')}
                  >
                    <div className="flex items-center">
                      Phone {getSortIcon('phone_number')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('section')}
                  >
                    <div className="flex items-center">
                      Section {getSortIcon('section')}
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
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer"
                      onClick={() => handleEdit(ticket)}
                    >
                      {ticket.TicketID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {ticket.section}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionsPopover ticket={ticket} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this ticket? This action cannot be undone."
      />

      <NoAccessModal isOpen={showNoAccessModal} onClose={() => setShowNoAccessModal(false)} />
    </div>
  );
};

export default TicketsList;