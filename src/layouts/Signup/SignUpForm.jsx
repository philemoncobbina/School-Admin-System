import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { signUpUser } from '../../Services/SignUpService';
import studentAuthService, {
  RELATIONSHIP_OPTIONS,
  ID_TYPE_OPTIONS,
} from '../../Services/studentAuthService';
import {
  Eye, EyeOff, RefreshCw, Users, GraduationCap, UserPlus,
  Mail, User, Lock, Hash, School, X, Plus, Trash2,
  Phone, MapPin, CreditCard, ChevronDown, ChevronUp, Star,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

const EMPTY_GUARDIAN = () => ({
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  relationship: 'father',
  primary_phone: '',
  secondary_phone: '',
  email: '',
  street_address: '',
  city: '',
  state_region: '',
  postal_code: '',
  id_type: 'national_id',
  id_number: '',
  is_primary_contact: false,
});

// ── Sub-component: collapsible guardian card ───────────────────────────────

const GuardianCard = ({
  guardian, index, total, onChange, onRemove, onSetPrimary, loading,
}) => {
  const [expanded, setExpanded] = useState(index === 0);

  const field = (
    name,
    label,
    placeholder,
    type = 'text',
    required = false,
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={guardian[name]}
        onChange={(e) => onChange(index, name, e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        required={required}
        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                   disabled:opacity-60 transition-all"
      />
    </div>
  );

  const select = (
    name,
    label,
    options,
    required = false,
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={guardian[name]}
        onChange={(e) => onChange(index, name, e.target.value)}
        disabled={loading}
        required={required}
        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                   disabled:opacity-60 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 ${
      guardian.is_primary_contact
        ? 'border-purple-300 bg-purple-50/40'
        : 'border-gray-200 bg-gray-50/40'
    }`}>
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        {/* Primary badge / set-primary button */}
        <button
          type="button"
          onClick={() => onSetPrimary(index)}
          title={guardian.is_primary_contact ? 'Primary contact' : 'Set as primary contact'}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            guardian.is_primary_contact
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-gray-200 text-gray-400 hover:bg-purple-100 hover:text-purple-500'
          }`}
          disabled={loading}
        >
          <Star size={14} fill={guardian.is_primary_contact ? 'currentColor' : 'none'} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {guardian.first_name || guardian.last_name
              ? `${guardian.first_name} ${guardian.last_name}`.trim()
              : `Guardian ${index + 1}`}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {RELATIONSHIP_OPTIONS.find((r) => r.value === guardian.relationship)?.label || '—'}
            {guardian.is_primary_contact && (
              <span className="ml-2 text-purple-600 font-medium">· Primary Contact</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {total > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Remove guardian"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">

          {/* ── Identity ── */}
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <User size={12} /> Identity
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('first_name',  'First Name',  'e.g. Kwame',      'text', true)}
              {field('middle_name', 'Middle Name', 'e.g. Asante')}
              {field('last_name',   'Last Name',   'e.g. Mensah',     'text', true)}
              {field('suffix',      'Suffix',      'e.g. Jr., III')}
            </div>
            <div className="mt-3">
              {select('relationship', 'Relationship to Student', RELATIONSHIP_OPTIONS, true)}
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <Phone size={12} /> Contact
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('primary_phone',   'Primary Phone',   '+233241234567', 'tel', true)}
              {field('secondary_phone', 'Secondary Phone', '+233301234567', 'tel')}
            </div>
            <div className="mt-3">
              {field('email', 'Personal Email', 'guardian@example.com', 'email')}
            </div>
          </div>

          {/* ── Address ── */}
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <MapPin size={12} /> Address
            </p>
            <div className="space-y-3">
              {field('street_address', 'Street Address', '12 Liberation Road')}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {field('city',         'City',        'Accra')}
                {field('state_region', 'Region',      'Greater Accra')}
                {field('postal_code',  'Postal Code', 'GA-123')}
              </div>
            </div>
          </div>

          {/* ── Identification ── */}
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <CreditCard size={12} /> Identification
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {select('id_type', 'ID Type', ID_TYPE_OPTIONS)}
              {field('id_number', 'ID Number', 'GHA-000000000-0')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

GuardianCard.propTypes = {
  guardian: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSetPrimary: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

// ── Main form ──────────────────────────────────────────────────────────────

const UnifiedSignupForm = () => {
  const [signupType, setSignupType] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Staff form
  const [staffData, setStaffData] = useState({
    email: '', username: '', password: '',
    first_name: '', last_name: '', role: 'staff',
  });

  // Student form
  const [studentData, setStudentData] = useState({
    email: '', first_name: '', last_name: '',
    index_number: '', class_name: '', password: '', username: '',
  });

  // Guardian list (starts with one empty guardian)
  const [guardians, setGuardians] = useState([
    { ...EMPTY_GUARDIAN(), is_primary_contact: true },
  ]);

  const classOptions = studentAuthService.getClassOptions();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardianChange = (index, field, value) => {
    setGuardians((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const handleSetPrimary = (index) => {
    setGuardians((prev) =>
      prev.map((g, i) => ({ ...g, is_primary_contact: i === index }))
    );
  };

  const handleAddGuardian = () => {
    setGuardians((prev) => [...prev, EMPTY_GUARDIAN()]);
  };

  const handleRemoveGuardian = (index) => {
    setGuardians((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Re-ensure exactly one primary
      if (next.length > 0 && !next.some((g) => g.is_primary_contact)) {
        next[0] = { ...next[0], is_primary_contact: true };
      }
      return next;
    });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const password = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    if (signupType === 'staff') {
      setStaffData((prev) => ({ ...prev, password }));
    } else {
      setStudentData((prev) => ({ ...prev, password }));
    }
  };

  const resetForm = () => {
    if (signupType === 'staff') {
      setStaffData({ email: '', username: '', password: '', first_name: '', last_name: '', role: 'staff' });
    } else {
      setStudentData({ email: '', first_name: '', last_name: '', index_number: '', class_name: '', password: '', username: '' });
      setGuardians([{ ...EMPTY_GUARDIAN(), is_primary_contact: true }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (signupType === 'staff') {
        const response = await signUpUser(staffData);
        setSuccess(response.data.message || 'Staff account created successfully!');
      } else {
        const payload = { ...studentData, guardians };
        const response = await studentAuthService.createStudent(payload);
        setSuccess(response.data.message || 'Student account created successfully!');
      }
      resetForm();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.guardians?.[0] ||
        (data && Object.values(data).flat().join(', ')) ||
        'Failed to create account.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupTypeChange = (type) => {
    setSignupType(type);
    setError('');
    setSuccess('');
  };

  const isFormValid = () => {
    if (signupType === 'staff') {
      return !!(staffData.first_name.trim() && staffData.last_name.trim() &&
                staffData.username.trim() && staffData.email.trim() &&
                staffData.password.trim() && staffData.role);
    }
    const studentOk =
      !!(studentData.first_name.trim() && studentData.last_name.trim() &&
         studentData.email.trim() && studentData.index_number.trim() &&
         studentData.class_name && studentData.password.trim());
    const guardiansOk = guardians.every(
      (g) => g.first_name.trim() && g.last_name.trim() &&
              g.relationship && g.primary_phone.trim()
    );
    return studentOk && guardiansOk;
  };

  const currentPassword =
    signupType === 'staff' ? staffData.password : studentData.password;

  // ── Render ──────────────────────────────────────────────────────────────

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

        {/* Tab toggle */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1 mb-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            {['staff', 'student'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSignupTypeChange(type)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  signupType === type
                    ? type === 'staff'
                      ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                      : 'bg-white text-purple-600 shadow-md border border-purple-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type === 'staff' ? <Users size={18} /> : <GraduationCap size={18} />}
                {type === 'staff' ? 'Staff & Principal' : 'Student'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center shadow-sm">
            <span className="flex-grow text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-4 hover:bg-red-100 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center shadow-sm">
            <span className="flex-grow text-sm">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-4 hover:bg-green-100 p-1 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {signupType === 'staff' ? (
              // ── Staff form (unchanged) ───────────────────────────────────
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['first_name', 'last_name'].map((name) => (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          {name === 'first_name' ? 'First Name' : 'Last Name'}
                        </div>
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={staffData[name]}
                        onChange={handleStaffChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={`Enter ${name === 'first_name' ? 'first' : 'last'} name`}
                        required
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>

                {[
                  { name: 'username', label: 'Username', icon: <User size={16} className="text-gray-500" />, placeholder: 'Choose a username' },
                  { name: 'email',    label: 'Email Address', icon: <Mail size={16} className="text-gray-500" />, placeholder: 'Enter email address', type: 'email' },
                ].map(({ name, label, icon, placeholder, type = 'text' }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-2">{icon}{label}</div>
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={staffData[name]}
                      onChange={handleStaffChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={placeholder}
                      required
                      disabled={loading}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2"><Users size={16} className="text-gray-500" />Role</div>
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
              // ── Student form ─────────────────────────────────────────────
              <>
                {/* Basic student info */}
                <div>
                  <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <GraduationCap size={18} className="text-purple-500" />
                    Student Information
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['first_name', 'last_name'].map((name) => (
                        <div key={name}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-500" />
                              {name === 'first_name' ? 'First Name' : 'Last Name'}
                            </div>
                          </label>
                          <input
                            type="text"
                            name={name}
                            value={studentData[name]}
                            onChange={handleStudentChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder={`Enter ${name === 'first_name' ? 'first' : 'last'} name`}
                            required
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-500" />Email Address
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Hash size={16} className="text-gray-500" />Index Number
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
                            <School size={16} className="text-gray-500" />Class
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
                          {classOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          Username
                          <span className="text-gray-400 text-xs">(Optional)</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={studentData.username}
                        onChange={handleStudentChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Leave blank to use index number"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Guardian section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                      <Users size={18} className="text-purple-500" />
                      Parent / Guardian Information
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddGuardian}
                      disabled={loading || guardians.length >= 4}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600
                                 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus size={13} />
                      Add Guardian
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Add at least one guardian. Click the{' '}
                    <Star size={11} className="inline text-purple-500" fill="currentColor" />{' '}
                    star icon to set the primary contact.
                  </p>

                  <div className="space-y-3">
                    {guardians.map((guardian, idx) => (
                      <GuardianCard
                        key={idx}
                        guardian={guardian}
                        index={idx}
                        total={guardians.length}
                        onChange={handleGuardianChange}
                        onRemove={handleRemoveGuardian}
                        onSetPrimary={handleSetPrimary}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Password (shared) */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gray-500" />Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={currentPassword}
                  onChange={signupType === 'staff' ? handleStaffChange : handleStudentChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-28 transition-all"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
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
                  ? 'Click Generate for an 8-character auto-password (A–Z, 0–9)'
                  : 'Choose a strong password or click Generate'}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 ${
                signupType === 'staff'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-300'
              } ${loading || !isFormValid() ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}`}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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