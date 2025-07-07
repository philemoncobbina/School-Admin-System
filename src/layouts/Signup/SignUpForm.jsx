import React, { useState } from 'react';
import { signUpUser } from '../../Services/SignUpService';
import studentAuthService from '../../Services/studentAuthService';
import { Eye, EyeOff, RefreshCw, Users, GraduationCap, UserPlus, Mail, User, Lock, Hash, School, X } from 'lucide-react';

const UnifiedSignupForm = () => {
  const [signupType, setSignupType] = useState('staff'); // 'staff' or 'student'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Staff/Principal form data
  const [staffData, setStaffData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'staff'
  });

  // Student form data
  const [studentData, setStudentData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    index_number: '',
    class_name: '',
    password: '',
    username: ''
  });

  const classOptions = [
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

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    if (signupType === 'staff') {
      setStaffData(prev => ({ ...prev, password }));
    } else {
      setStudentData(prev => ({ ...prev, password }));
    }
  };

  const resetForm = () => {
    if (signupType === 'staff') {
      setStaffData({
        email: '',
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'staff'
      });
    } else {
      setStudentData({
        email: '',
        first_name: '',
        last_name: '',
        index_number: '',
        class_name: '',
        password: '',
        username: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let response;
      if (signupType === 'staff') {
        response = await signUpUser(staffData);
        setSuccess(response.data.message || 'Staff account created successfully!');
      } else {
        response = await studentAuthService.createStudent(studentData);
        setSuccess(response.data.message || 'Student account created successfully!');
      }
      resetForm();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      Object.values(err.response?.data || {}).flat().join(', ') || 
                      'Failed to create account.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupTypeChange = (type) => {
    setSignupType(type);
    setError('');
    setSuccess('');
  };

  const closeAlert = (type) => {
    if (type === 'error') setError('');
    if (type === 'success') setSuccess('');
  };

  const currentPassword = signupType === 'staff' ? staffData.password : studentData.password;

  // Form validation
  const isFormValid = () => {
    if (signupType === 'staff') {
      return staffData.first_name.trim() && 
             staffData.last_name.trim() && 
             staffData.username.trim() && 
             staffData.email.trim() && 
             staffData.password.trim() && 
             staffData.role;
    } else {
      return studentData.first_name.trim() && 
             studentData.last_name.trim() && 
             studentData.email.trim() && 
             studentData.index_number.trim() && 
             studentData.class_name && 
             studentData.password.trim();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Choose your account type and complete registration</p>
        </div>

        {/* Signup Type Toggle */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1 mb-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleSignupTypeChange('staff')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                signupType === 'staff'
                  ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={18} />
              Staff & Principal
            </button>
            <button
              type="button"
              onClick={() => handleSignupTypeChange('student')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                signupType === 'student'
                  ? 'bg-white text-purple-600 shadow-md border border-purple-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap size={18} />
              Student
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center shadow-sm">
            <span className="flex-grow text-sm">{error}</span>
            <button onClick={() => closeAlert('error')} className="ml-4 hover:bg-red-100 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center shadow-sm">
            <span className="flex-grow text-sm">{success}</span>
            <button onClick={() => closeAlert('success')} className="ml-4 hover:bg-green-100 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {signupType === 'staff' ? (
              // Staff/Principal Form
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        First Name
                      </div>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={staffData.first_name}
                      onChange={handleStaffChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter first name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        Last Name
                      </div>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={staffData.last_name}
                      onChange={handleStaffChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter last name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      Username
                    </div>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={staffData.username}
                    onChange={handleStaffChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Choose a username"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={staffData.email}
                    onChange={handleStaffChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-500" />
                      Role
                    </div>
                  </label>
                  <select
                    name="role"
                    value={staffData.role}
                    onChange={handleStaffChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={loading}
                  >
                    <option value="staff">Staff</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>
              </>
            ) : (
              // Student Form
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        First Name
                      </div>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={studentData.first_name}
                      onChange={handleStudentChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter first name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        Last Name
                      </div>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={studentData.last_name}
                      onChange={handleStudentChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter last name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={studentData.email}
                    onChange={handleStudentChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Index Number and Class */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Hash size={16} className="text-gray-500" />
                        Index Number
                      </div>
                    </label>
                    <input
                      type="text"
                      name="index_number"
                      value={studentData.index_number}
                      onChange={handleStudentChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter index number"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <School size={16} className="text-gray-500" />
                        Class
                      </div>
                    </label>
                    <select
                      name="class_name"
                      value={studentData.class_name}
                      onChange={handleStudentChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                      disabled={loading}
                    >
                      <option value="">Select a class</option>
                      {classOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Username (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      Username <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={studentData.username}
                    onChange={handleStudentChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Choose a username (optional)"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use index number as username</p>
                </div>
              </>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gray-500" />
                  Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={currentPassword}
                  onChange={signupType === 'staff' ? handleStaffChange : handleStudentChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24 transition-all"
                  placeholder="Enter password"
                  required
                  disabled={loading || signupType === 'student'}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                    disabled={loading}
                  >
                    <RefreshCw size={12} />
                    Generate
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {signupType === 'student' 
                  ? 'Password will be automatically generated (8 characters: A-Z, 0-9)' 
                  : 'Choose a strong password or click Generate'
                }
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 ${
                signupType === 'staff'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-300'
              } ${(loading || !isFormValid()) ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}`}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                `Create ${signupType === 'staff' ? 'Staff' : 'Student'} Account`
              )}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignupForm;