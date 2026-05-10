// EditUserModal.jsx

import React, { useState } from 'react';
import { X, User, Mail, UserCheck, Hash, GraduationCap, Save, XCircle } from 'lucide-react';
import { CLASS_OPTIONS } from '../../Services/studentAuthService';

const EditUserModal = ({ formData, setFormData, handleSaveUser, setEditMode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try { await handleSaveUser(); }
    finally { setIsLoading(false); }
  };

  const inputCls =
    'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
    'transition-all duration-200 hover:bg-gray-100';

  const field = (key, label, Icon, type = 'text', extra = {}) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" /> {label}
      </label>
      <input
        type={type}
        value={formData[key] || ''}
        onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
        className={inputCls}
        {...extra}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && setEditMode(false)}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

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
          <button onClick={() => setEditMode(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors group">
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('first_name', 'First Name', User, 'text', { placeholder: 'Enter first name' })}
            {field('last_name',  'Last Name',  User, 'text', { placeholder: 'Enter last name'  })}
          </div>

          {/* Email — read-only */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" /> Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed text-gray-600"
            />
            <p className="text-xs text-gray-500">Email addresses cannot be modified for security reasons</p>
          </div>

          {/* Role */}
          {formData.role && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" /> Role
              </label>
              {formData.role === 'student' ? (
                <input
                  value="Student" disabled
                  className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl cursor-not-allowed text-green-800 font-medium"
                />
              ) : (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  className={inputCls + ' appearance-none'}
                >
                  <option value="staff">Staff Member</option>
                  <option value="principal">Principal</option>
                </select>
              )}
            </div>
          )}

          {/* Student-only fields */}
          {formData.role === 'student' && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-800 font-medium">
                <GraduationCap className="w-4 h-4" /> Student Information
              </div>
              {field('index_number', 'Index Number', Hash, 'text', { placeholder: 'Enter index number' })}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" /> Class
                </label>
                <select
                  value={formData.class_name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, class_name: e.target.value }))}
                  className={inputCls + ' appearance-none'}
                >
                  <option value="">Select a class</option>
                  {CLASS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={() => setEditMode(false)}
            disabled={isLoading}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;