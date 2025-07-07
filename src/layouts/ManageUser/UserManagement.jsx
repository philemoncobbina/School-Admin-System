import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllUsers, blockUser, unblockUser, editUser, deleteUser, activateUser } from '../../Services/AdminUserService';
import EditUserModal from './EditUserModal';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import studentAuthService from '../../Services/studentAuthService';
import { 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Shield,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  UserX,
  Eye,
  Plus
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ROLE_OPTIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' }
];

const CLASS_OPTIONS = [
  { value: 'Creche', label: 'Creche' },
  { value: 'Nursery', label: 'Nursery' },
  { value: 'KG 1', label: 'KG 1' },
  { value: 'KG 2', label: 'KG 2' },
  { value: 'Class 1', label: 'Class 1' },
  { value: 'Class 2', label: 'Class 2' },
  { value: 'Class 3', label: 'Class 3' },
  { value: 'Class 4', label: 'Class 4' },
  { value: 'Class 5', label: 'Class 5' },
  { value: 'Class 6', label: 'Class 6' },
  { value: 'JHS 1', label: 'JHS 1' },
  { value: 'JHS 2', label: 'JHS 2' },
  { value: 'JHS 3', label: 'JHS 3' }
];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        index_number: '',
        class_name: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        let result = [...users];
        
        // Apply role filter
        if (roleFilter !== '') {
            if (roleFilter === 'no_role') {
                result = result.filter(user => !user.role);
            } else {
                result = result.filter(user => user.role === roleFilter);
            }
        }
        
        // Apply class filter (only for students)
        if (classFilter !== '' && roleFilter === 'student') {
            result = result.filter(user => user.class_name === classFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter((user) =>
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.role ? user.role.toLowerCase().includes(searchTerm.toLowerCase()) : false)
            );
        }
        
        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                // Handle date sorting
                if (sortConfig.key === 'last_login' || sortConfig.key === 'date_joined') {
                    aValue = aValue ? new Date(aValue) : new Date(0);
                    bValue = bValue ? new Date(bValue) : new Date(0);
                }
                
                // Handle name sorting
                if (sortConfig.key === 'full_name') {
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
        
        setFilteredUsers(result);
    }, [searchTerm, users, sortConfig, roleFilter, classFilter]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchAllUsers();
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (error) {
            setError('Failed to load users. Please try again later.');
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlockUser = async (userId) => {
        try {
            await blockUser(userId);
            loadUsers();
        } catch (error) {
            setError('Failed to block user. Please try again later.');
            console.error('Error blocking user:', error);
        }
    };

    const handleUnblockUser = async (userId) => {
        try {
            await unblockUser(userId);
            loadUsers();
        } catch (error) {
            setError('Failed to unblock user. Please try again later.');
            console.error('Error unblocking user:', error);
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            await activateUser(userId);
            loadUsers();
        } catch (error) {
            setError('Failed to activate user. Please try again later.');
            console.error('Error activating user:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId);
            loadUsers();
        } catch (error) {
            setError('Failed to delete user. Please try again later.');
            console.error('Error deleting user:', error);
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role || '',
            index_number: user.index_number || '',
            class_name: user.class_name || '',
        });
        setEditMode(true);
    };

    const handleSaveUser = async () => {
        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.role) {
                delete dataToSubmit.role;
            }
            
            // Only include student fields if role is student
            if (dataToSubmit.role !== 'student') {
                delete dataToSubmit.index_number;
                delete dataToSubmit.class_name;
            }
            
            await editUser(selectedUser.id, dataToSubmit);
            setEditMode(false);
            loadUsers();
        } catch (error) {
            setError('Failed to save user. Please try again later.');
            console.error('Error saving user:', error);
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

    const getStatusBadge = (user) => {
        if (user.is_blocked) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                    <UserX className="w-3 h-3 mr-1 text-red-500" />
                    <span className="hidden sm:inline">Blocked</span>
                    <span className="sm:hidden">B</span>
                </span>
            );
        } else if (user.is_active) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                    <UserCheck className="w-3 h-3 mr-1 text-green-500" />
                    <span className="hidden sm:inline">Active</span>
                    <span className="sm:hidden">A</span>
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1 text-yellow-500" />
                    <span className="hidden sm:inline">Inactive</span>
                    <span className="sm:hidden">I</span>
                </span>
            );
        }
    };

    const getRoleBadge = (user) => {
        if (!user.role) {
            return (
                <span className="inline-flex items-center text-sm text-gray-500 italic">
                    Not Assigned
                </span>
            );
        }

        const roleConfig = {
            'principal': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Shield },
            'staff': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: ShieldCheck },
            'student': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: User }
        };

        const config = roleConfig[user.role] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: User };
        const IconComponent = config.icon;

        return (
            <div className="flex flex-col">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                    <IconComponent className="w-3 h-3 mr-1" />
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                {user.role === 'student' && user.class_name && (
                    <span className="text-xs text-gray-500 mt-1">
                        ({getClassLabel(user.class_name)})
                    </span>
                )}
            </div>
        );
    };

    // Helper function to get class label from class value
    const getClassLabel = (classValue) => {
        const classOptions = studentAuthService.getClassOptions();
        const classOption = classOptions.find(option => option.value === classValue);
        return classOption ? classOption.label : classValue;
    };

    // Actions Popover component
    const ActionsPopover = ({ user }) => {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-0 bg-white" align="end">
                    <div className="py-1">
                        {user.is_blocked ? (
                            <button
                                onClick={() => handleUnblockUser(user.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <UserCheck className="h-4 w-4" /> Unblock
                            </button>
                        ) : (
                            <button
                                onClick={() => handleBlockUser(user.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <UserX className="h-4 w-4" /> Block
                            </button>
                        )}
                        {!user.is_active && !user.is_blocked && (
                            <button
                                onClick={() => handleActivateUser(user.id)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <UserCheck className="h-4 w-4" /> Activate
                            </button>
                        )}
                        <button
                            onClick={() => handleEditUser(user)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <Edit2 className="h-4 w-4" /> Edit
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                    handleDeleteUser(user.id);
                                }
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" /> Delete
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
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No users found</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mb-4 sm:mb-6">
                {searchTerm || roleFilter || classFilter ? 
                    "We couldn't find any users matching your search criteria." : 
                    "There are currently no users in the system."}
            </p>
            {(searchTerm || roleFilter || classFilter) && (
                <button 
                    onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('');
                        setClassFilter('');
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
            <p className="text-sm sm:text-base text-gray-600 font-medium">Loading users...</p>
        </div>
    );

    return (
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-9xl mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
                <Link to="/dashboard/users/create-user">



          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">



            <PlusCircle className="w-4 h-4 mr-2" />



            Create User



          </Button>



        </Link>
            </div>

            <div className="bg-white shadow-sm sm:shadow-md rounded-lg sm:rounded-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                            Users
                            <span className="ml-2 text-xs sm:text-sm font-medium text-gray-500">
                                {filteredUsers.length} {filteredUsers.length === 1 ? 'record' : 'records'}
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
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 sm:py-2.5 pl-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        
                        {/* Role Filter */}
                        <div className="relative">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                                <div className="relative">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => {
                                            setRoleFilter(e.target.value);
                                            // Clear class filter when role changes
                                            if (e.target.value !== 'student') {
                                                setClassFilter('');
                                            }
                                        }}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 sm:py-2.5 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[120px]"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="no_role">No Role</option>
                                        {ROLE_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
                                </div>
                            </div>
                        </div>

                        {/* Class Filter - Only show when role is student */}
                        {roleFilter === 'student' && (
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <select
                                            value={classFilter}
                                            onChange={(e) => setClassFilter(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 sm:py-2.5 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[120px]"
                                        >
                                            <option value="">All Classes</option>
                                            {CLASS_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 m-3 sm:m-4 rounded-md" role="alert">
                        <p className="font-medium text-sm sm:text-base">{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <LoadingState />
                ) : filteredUsers.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[150px]"
                                        onClick={() => requestSort('full_name')}
                                    >
                                        <div className="flex items-center">
                                            Name {getSortIcon('full_name')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[180px]"
                                        onClick={() => requestSort('email')}
                                    >
                                        <div className="flex items-center">
                                            Email {getSortIcon('email')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                                        onClick={() => requestSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role {getSortIcon('role')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[100px]"
                                    >
                                        Status
                                    </th>
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[140px]"
                                        onClick={() => requestSort('last_login')}
                                    >
                                        <div className="flex items-center">
                                            Last Login {getSortIcon('last_login')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[140px]"
                                        onClick={() => requestSort('date_joined')}
                                    >
                                        <div className="flex items-center">
                                            Date Joined {getSortIcon('date_joined')}
                                        </div>
                                    </th>
                                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px] sticky right-0 bg-gray-50">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                                            <div className="truncate max-w-[150px]" title={`${user.first_name} ${user.last_name}`}>
                                                {`${user.first_name} ${user.last_name}`}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-800">
                                            <div className="truncate max-w-[180px]" title={user.email}>
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                                            {getRoleBadge(user)}
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                                            {getStatusBadge(user)}
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-500">
                                            <div className="whitespace-nowrap text-xs sm:text-sm">
                                                {formatDateTime(user.last_login) || 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-500">
                                            <div className="whitespace-nowrap text-xs sm:text-sm">
                                                {formatDate(user.date_joined)}
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm font-medium sticky right-0 ">
                                            <ActionsPopover user={user} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editMode && (
                <EditUserModal
                    formData={formData}
                    setFormData={setFormData}
                    handleSaveUser={handleSaveUser}
                    setEditMode={setEditMode}
                />
            )}
        </div>
    );
};

export default UserManagement;