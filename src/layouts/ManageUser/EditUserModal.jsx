import React, { useEffect, useState } from 'react';
import { X, User, Mail, UserCheck, Hash, GraduationCap, Save, XCircle } from 'lucide-react';
import studentAuthService from '../../Services/studentAuthService';

const EditUserModal = ({ formData, setFormData, handleSaveUser, setEditMode }) => {
    const [classOptions, setClassOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load class options when component mounts
        const options = studentAuthService.getClassOptions();
        setClassOptions(options);
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await handleSaveUser();
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setEditMode(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
                            <p className="text-sm text-gray-500">Update user information</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEditMode(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                First Name
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                                placeholder="Enter first name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            Email Address
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none cursor-not-allowed text-gray-600"
                                disabled={true}
                                placeholder="Email cannot be changed"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Email addresses cannot be modified for security reasons</p>
                    </div>

                    {/* Role Section */}
                    {formData.role && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-gray-500" />
                                Role
                            </label>
                            {formData.role === 'student' ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value="Student"
                                        className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl focus:outline-none cursor-not-allowed text-green-800 font-medium"
                                        disabled={true}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <GraduationCap className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100 appearance-none"
                                    >
                                        <option value="staff">Staff Member</option>
                                        <option value="principal">Principal</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Student-specific fields */}
                    {formData.role === 'student' && (
                        <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-800 font-medium">
                                <GraduationCap className="w-4 h-4" />
                                Student Information
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-gray-500" />
                                    Index Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.index_number || ''}
                                    onChange={(e) => setFormData({ ...formData, index_number: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter index number"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                    Class
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.class_name || ''}
                                        onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                                    >
                                        <option value="">Select a class</option>
                                        {classOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={() => setEditMode(false)}
                        disabled={isLoading}
                        className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;