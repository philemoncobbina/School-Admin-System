import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactService from '../../Services/ContactService';
import UserService from '../../Services/UserService';
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
  MessageSquare,
  Clock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import NoAccessModal from './NoAccessModal';

// Status options
const STATUS_OPTIONS = [
  { value: 'unattended', label: 'Unattended' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' }
];

// Helper function for status styles
const getStatusStyles = (status) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'unattended':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'resolved':
      return <MessageSquare className="w-4 h-4 mr-1 text-green-500" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 mr-1 text-yellow-500" />;
    default:
      return <Clock className="w-4 h-4 mr-1 text-red-500" />;
  }
};

const getStatusBadge = (status) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}>
      {getStatusIcon(status)}
      {status.replace('_', ' ')}
    </span>
  );
};

const ComplaintForm = () => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [contactLogs, setContactLogs] = useState({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isNoAccessModalOpen, setIsNoAccessModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    
    const navigate = useNavigate();

    useEffect(() => {
        fetchContacts();
        fetchUserRole();
    }, []);

    useEffect(() => {
        let result = [...contacts];
        
        // Apply status filter
        if (statusFilter !== '') {
            result = result.filter(contact => contact.status === statusFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter((contact) =>
                `${contact.firstName} ${contact.lastName} ${contact.email}`
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
        
        setFilteredContacts(result);
    }, [searchTerm, contacts, sortConfig, statusFilter]);

    // Fetch contact list
    const fetchContacts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ContactService.getContacts();
            setContacts(data);
            setFilteredContacts(data);
            const logs = await Promise.all(data.map(async (contact) => ({
                id: contact.id,
                logs: await ContactService.getContactLogs(contact.id),
            })));
            const logsMap = logs.reduce((acc, { id, logs }) => {
                acc[id] = logs;
                return acc;
            }, {});
            setContactLogs(logsMap);
        } catch (err) {
            setError('Failed to load complaints. Please try again later.');
            console.error('Error fetching contacts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch user role
    const fetchUserRole = async () => {
        try {
            const userDetails = await UserService.getUserDetails();
            setUserRole(userDetails.role);
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    };

    // Delete Modal
    const openDeleteModal = (contact) => {
        userRole === 'principal' ? setSelectedContact(contact) : setIsNoAccessModalOpen(true);
        setIsDeleteModalOpen(userRole === 'principal');
        setDeleteId(contact.id);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedContact(null);
        setDeleteId(null);
    };

    const closeNoAccessModal = () => setIsNoAccessModalOpen(false);

    // Handle Delete
    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await ContactService.deleteContact(selectedContact.id);
            const updatedContacts = contacts.filter(contact => contact.id !== selectedContact.id);
            setContacts(updatedContacts);
            setFilteredContacts(updatedContacts);
            closeDeleteModal();
        } catch (error) {
            setError('Failed to delete complaint. Please try again later.');
            console.error('Error deleting contact:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Edit Modal
    const openEditModal = (contactId) => navigate(`/dashboard/complaints/edit/${contactId}`);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    const getStatusDisplayName = (status) => 
        STATUS_OPTIONS.find(s => s.value === status)?.label || status;

    // Actions Popover component
    const ActionsPopover = ({ contact }) => {
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
                            onClick={() => openEditModal(contact.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <FileEdit className="h-4 w-4" /> Edit
                        </button>
                        <button
                            onClick={() => openDeleteModal(contact)}
                            disabled={isDeleting && deleteId === contact.id}
                            className="flex gap-2 items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="text-red-400 h-4 w-4" /> 
                            {isDeleting && deleteId === contact.id ? 'Deleting...' : 'Delete'}
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints found</h3>
            <p className="text-gray-500 max-w-sm mb-6">
                {searchTerm || statusFilter ? 
                    "We couldn't find any complaints matching your search criteria." : 
                    "There are currently no complaints in the system."}
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
        </div>
    );

    const LoadingState = () => (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading complaints...</p>
        </div>
    );

    return (
        <div className="container mb-8 mx-auto px-4 max-w-9xl mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complaints</h1>
            </div>

            <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Complaint List
                            <span className="ml-2 text-sm font-medium text-gray-500">
                                {filteredContacts.length} {filteredContacts.length === 1 ? 'record' : 'records'}
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-gray-100">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
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
                                <option value="">All Status</option>
                                {STATUS_OPTIONS.map(option => (
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
                ) : filteredContacts.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('firstName')}
                                    >
                                        <div className="flex items-center">
                                            First Name {getSortIcon('firstName')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => requestSort('lastName')}
                                    >
                                        <div className="flex items-center">
                                            Last Name {getSortIcon('lastName')}
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
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        Phone Number
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        Message
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        User Email
                                    </th>
                                    <th 
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        Timestamp
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
                                {filteredContacts.map((contact) => (
                                    <tr 
                                        key={contact.id} 
                                        className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {contact.firstName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {contact.lastName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {contact.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {contact.phoneNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">
                                            {contact.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            {contactLogs[contact.id]?.[0]?.user_email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {contactLogs[contact.id]?.[0]?.timestamp
                                                ? formatDate(contactLogs[contact.id][0].timestamp)
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(contact.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <ActionsPopover contact={contact} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete} 
            />

            <NoAccessModal
                isOpen={isNoAccessModalOpen}
                onClose={closeNoAccessModal}
            />
        </div>
    );
};

export default ComplaintForm;