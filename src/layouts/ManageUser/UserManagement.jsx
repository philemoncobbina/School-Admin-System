// UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllUsers, blockUser, unblockUser, editUser, deleteUser, activateUser } from '../../Services/AdminUserService';
import EditUserModal from './EditUserModal';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CLASS_OPTIONS, RELATIONSHIP_OPTIONS, ID_TYPE_OPTIONS } from '../../Services/studentAuthService';
import {
  Search, MoreHorizontal, Edit2, Trash2, RefreshCw, Filter,
  ChevronDown, ChevronUp, Clock, User, Shield, ShieldCheck,
  UserCheck, PlusCircle, UserX, Plus, Trash, Star,
  Phone, MapPin, CreditCard, X, ChevronRight, AlertCircle,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Shared style ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all';

// ── Constants ──────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'staff',     label: 'Staff'     },
  { value: 'student',   label: 'Student'   },
];

const EMPTY_GUARDIAN = () => ({
  id: null,
  first_name: '', middle_name: '', last_name: '', suffix: '',
  relationship: 'father',
  primary_phone: '', secondary_phone: '', email: '',
  street_address: '', city: '', state_region: '', postal_code: '',
  id_type: 'national_id', id_number: '',
  is_primary_contact: false,
});

// ── Small reusable field renderers ─────────────────────────────────────────

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input type={type} value={value || ''} onChange={onChange}
    placeholder={placeholder} required={required} className={inputCls} />
);

const SelectInput = ({ value, onChange, options, required }) => (
  <select value={value || ''} onChange={onChange} required={required} className={inputCls}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ── GuardianEditor ─────────────────────────────────────────────────────────

const GuardianEditor = ({ guardian, index, total, onChange, onRemove, onSetPrimary }) => {
  const [expanded, setExpanded] = useState(index === 0);

  const f = (key, label, placeholder, type = 'text', required = false) => (
    <FormField label={label} required={required}>
      <TextInput
        value={guardian[key]}
        onChange={(e) => onChange(index, key, e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </FormField>
  );

  const s = (key, label, options, required = false) => (
    <FormField label={label} required={required}>
      <SelectInput
        value={guardian[key]}
        onChange={(e) => onChange(index, key, e.target.value)}
        options={options}
        required={required}
      />
    </FormField>
  );

  const displayName =
    guardian.first_name || guardian.last_name
      ? `${guardian.first_name} ${guardian.last_name}`.trim()
      : `Guardian ${index + 1}`;

  const relationshipLabel =
    RELATIONSHIP_OPTIONS.find((r) => r.value === guardian.relationship)?.label || '—';

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${
      guardian.is_primary_contact ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 bg-gray-50/30'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => onSetPrimary(index)} title="Set as primary"
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            guardian.is_primary_contact
              ? 'bg-purple-500 text-white shadow'
              : 'bg-gray-200 text-gray-400 hover:bg-purple-100 hover:text-purple-500'
          }`}>
          <Star size={13} fill={guardian.is_primary_contact ? 'currentColor' : 'none'} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
          <p className="text-xs text-gray-500">
            {relationshipLabel}
            {guardian.is_primary_contact && (
              <span className="ml-2 text-purple-600 font-medium">· Primary Contact</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {total > 1 && (
            <button type="button" onClick={() => onRemove(index)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <Trash size={14} />
            </button>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
            {expanded ? <ChevronUp size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-4">

          <section>
            <SectionTitle icon={<User size={11} />} label="Identity" />
            <div className="grid grid-cols-2 gap-2">
              {f('first_name',  'First Name',  'Kwame',    'text', true)}
              {f('middle_name', 'Middle Name', 'Asante')}
              {f('last_name',   'Last Name',   'Mensah',   'text', true)}
              {f('suffix',      'Suffix',      'Jr., III')}
            </div>
            <div className="mt-2">{s('relationship', 'Relationship', RELATIONSHIP_OPTIONS, true)}</div>
          </section>

          <section>
            <SectionTitle icon={<Phone size={11} />} label="Contact" />
            <div className="grid grid-cols-2 gap-2">
              {f('primary_phone',   'Primary Phone',   '+233241234567', 'tel', true)}
              {f('secondary_phone', 'Secondary Phone', '+233301234567', 'tel')}
            </div>
            <div className="mt-2">{f('email', 'Personal Email', 'guardian@example.com', 'email')}</div>
          </section>

          <section>
            <SectionTitle icon={<MapPin size={11} />} label="Address" />
            {f('street_address', 'Street Address', '12 Liberation Road')}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {f('city',         'City',        'Accra')}
              {f('state_region', 'Region',      'Greater Accra')}
              {f('postal_code',  'Postal Code', 'GA-123')}
            </div>
          </section>

          <section>
            <SectionTitle icon={<CreditCard size={11} />} label="Identification" />
            <div className="grid grid-cols-2 gap-2">
              {s('id_type',   'ID Type',   ID_TYPE_OPTIONS)}
              {f('id_number', 'ID Number', 'GHA-000000000-0')}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ icon, label }) => (
  <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
    {icon} {label}
  </p>
);

// ── EditStudentModal ───────────────────────────────────────────────────────

const EditStudentModal = ({ formData, setFormData, guardians, setGuardians, onSave, onClose, saveError }) => {
  const modalInputCls =
    'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all';

  const handleGuardianChange = (index, key, value) =>
    setGuardians((prev) => prev.map((g, i) => (i === index ? { ...g, [key]: value } : g)));

  const handleSetPrimary = (index) =>
    setGuardians((prev) => prev.map((g, i) => ({ ...g, is_primary_contact: i === index })));

  const handleAddGuardian = () =>
    setGuardians((prev) => [...prev, EMPTY_GUARDIAN()]);

  const handleRemoveGuardian = (index) =>
    setGuardians((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((g) => g.is_primary_contact)) {
        next[0] = { ...next[0], is_primary_contact: true };
      }
      return next;
    });

  const studentField = (name, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        name={name} type={type}
        value={formData[name] || ''}
        onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))}
        className={modalInputCls}
        {...extra}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Student</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {formData.first_name} {formData.last_name} · {formData.index_number}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Student info */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <User size={15} className="text-purple-500" /> Student Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {studentField('first_name',   'First Name',   'text', { placeholder: 'First name'  })}
              {studentField('last_name',    'Last Name',    'text', { placeholder: 'Last name'   })}
              <div className="col-span-2">
                {studentField('email', 'Email', 'email', { placeholder: 'Email address' })}
              </div>
              {studentField('index_number', 'Index Number', 'text', { placeholder: 'Index number'})}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
                <select
                  name="class_name"
                  value={formData.class_name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, class_name: e.target.value }))}
                  className={modalInputCls}
                >
                  <option value="">Select class</option>
                  {CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* Guardians */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Phone size={15} className="text-purple-500" /> Parent / Guardian Information
              </h3>
              <button type="button" onClick={handleAddGuardian} disabled={guardians.length >= 4}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600
                           bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Plus size={12} /> Add Guardian
              </button>
            </div>

            {guardians.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                No guardian on record.{' '}
                <button type="button" onClick={handleAddGuardian}
                  className="text-purple-500 font-semibold hover:underline">Add one</button>
              </div>
            ) : (
              <div className="space-y-3">
                {guardians.map((g, i) => (
                  <GuardianEditor
                    key={i} guardian={g} index={i} total={guardians.length}
                    onChange={handleGuardianChange}
                    onRemove={handleRemoveGuardian}
                    onSetPrimary={handleSetPrimary}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Inline save error — shown just above the footer actions */}
        {saveError && (
          <div className="mx-6 mb-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={onSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700
                       hover:from-purple-700 hover:to-purple-800 rounded-xl shadow-md hover:shadow-lg transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ── UserManagement ─────────────────────────────────────────────────────────

const UserManagement = () => {
  const [users,         setUsers]         = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [editMode,      setEditMode]      = useState(false);
  const [formData,      setFormData]      = useState({
    first_name: '', last_name: '', email: '', role: '', index_number: '', class_name: '',
  });
  const [editGuardians, setEditGuardians] = useState([]);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [classFilter,   setClassFilter]   = useState('');
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);
  // Separate error state scoped to the edit modal so the message appears inline
  const [saveError,     setSaveError]     = useState(null);
  const [sortConfig,    setSortConfig]    = useState({ key: null, direction: null });

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let result = [...users];

    if (roleFilter === 'no_role') result = result.filter((u) => !u.role);
    else if (roleFilter)          result = result.filter((u) => u.role === roleFilter);

    if (classFilter && roleFilter === 'student')
      result = result.filter((u) => u.class_name === classFilter);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role?.toLowerCase().includes(q) ?? false)
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let av = sortConfig.key === 'full_name' ? `${a.first_name} ${a.last_name}` : a[sortConfig.key];
        let bv = sortConfig.key === 'full_name' ? `${b.first_name} ${b.last_name}` : b[sortConfig.key];
        if (['last_login', 'date_joined'].includes(sortConfig.key)) {
          av = av ? new Date(av) : new Date(0);
          bv = bv ? new Date(bv) : new Date(0);
        }
        if (av < bv) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (av > bv) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    setFilteredUsers(result);
  }, [searchTerm, users, sortConfig, roleFilter, classFilter]);

  // ── API helpers ──────────────────────────────────────────────────────────

  const loadUsers = async () => {
    try {
      setIsLoading(true); setError(null);
      const { data } = await fetchAllUsers();
      setUsers(data); setFilteredUsers(data);
    } catch { setError('Failed to load users. Please try again later.'); }
    finally   { setIsLoading(false); }
  };

  // Generic action wrapper eliminates 4 identical try/catch blocks
  const userAction = (fn, errMsg) => async (id) => {
    try { await fn(id); loadUsers(); }
    catch { setError(errMsg); }
  };

  const handleBlockUser    = userAction(blockUser,    'Failed to block user.');
  const handleUnblockUser  = userAction(unblockUser,  'Failed to unblock user.');
  const handleActivateUser = userAction(activateUser, 'Failed to activate user.');
  const handleDeleteUser   = userAction(deleteUser,   'Failed to delete user.');

  // ── Edit handlers ────────────────────────────────────────────────────────

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setSaveError(null);
    setFormData({
      first_name:   user.first_name,
      last_name:    user.last_name,
      email:        user.email,
      role:         user.role || '',
      index_number: user.index_number || '',
      class_name:   user.class_name || '',
    });
    if (user.role === 'student') {
      const existing = (user.guardians || []).map((g) => ({ ...EMPTY_GUARDIAN(), ...g }));
      setEditGuardians(
        existing.length > 0 ? existing : [{ ...EMPTY_GUARDIAN(), is_primary_contact: true }]
      );
    } else {
      setEditGuardians([]);
    }
    setEditMode(true);
  };

  /**
   * Extract a human-readable message from an Axios error.
   *
   * Priority order:
   *   1. response.data.error  — our standard DRF error shape
   *   2. response.data.detail — DRF's default permission/auth messages
   *   3. First value in response.data if it's an object (field-level errors)
   *   4. Stringified response.data as a last resort
   *   5. The JS error message itself when there is no response (network error, etc.)
   */
  const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || 'Failed to save user. Please try again later.';

    if (typeof data === 'string') return data;

    if (data.error)  return data.error;
    if (data.detail) return data.detail;

    // Field-level validation errors — show the first one
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        const msg = Array.isArray(val) ? val[0] : val;
        return `${firstKey}: ${msg}`;
      }
    }

    return 'Failed to save user. Please try again later.';
  };

  const handleSaveUser = async () => {
    // Clear any previous save error each attempt
    setSaveError(null);
    try {
      const payload = { ...formData };
      if (!payload.role) delete payload.role;
      if (payload.role === 'student') payload.guardians = editGuardians;
      else { delete payload.index_number; delete payload.class_name; }
      await editUser(selectedUser.id, payload);
      setEditMode(false);
      loadUsers();
    } catch (err) {
      // Surface the real server message inside the modal
      setSaveError(extractErrorMessage(err));
    }
  };

  // ── Utilities ────────────────────────────────────────────────────────────

  const formatDate     = (d) => d ? format(new Date(d), 'MMM d, yyyy')          : '';
  const formatDateTime = (d) => d ? format(new Date(d), 'MMM d, yyyy, h:mm a')  : '';

  const requestSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));

  const getSortIcon = (name) => {
    if (sortConfig.key !== name) return null;
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const getClassLabel = (val) =>
    CLASS_OPTIONS.find((o) => o.value === val)?.label ?? val;

  // ── Badges ───────────────────────────────────────────────────────────────

  const getStatusBadge = (user) => {
    const cfg = user.is_blocked
      ? { cls: 'bg-red-50 text-red-700 border-red-200',     Icon: UserX,    label: 'Blocked'  }
      : user.is_active
      ? { cls: 'bg-green-50 text-green-700 border-green-200', Icon: UserCheck, label: 'Active'   }
      : { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', Icon: Clock, label: 'Inactive' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
        <cfg.Icon className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">{cfg.label}</span>
        <span className="sm:hidden">{cfg.label[0]}</span>
      </span>
    );
  };

  const getRoleBadge = (user) => {
    if (!user.role) return <span className="text-sm text-gray-500 italic">Not Assigned</span>;
    const cfg = {
      principal: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', Icon: Shield     },
      staff:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   Icon: ShieldCheck },
      student:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  Icon: User        },
    }[user.role] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', Icon: User };

    return (
      <div className="flex flex-col">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <cfg.Icon className="w-3 h-3 mr-1" />
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
        {user.role === 'student' && user.class_name && (
          <span className="text-xs text-gray-500 mt-1">({getClassLabel(user.class_name)})</span>
        )}
      </div>
    );
  };

  // ── Actions popover ──────────────────────────────────────────────────────

  const ActionsPopover = ({ user }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-0 bg-white" align="end">
        <div className="py-1">
          {user.is_blocked ? (
            <ActionBtn onClick={() => handleUnblockUser(user.id)} icon={UserCheck} label="Unblock" color="green" />
          ) : (
            <ActionBtn onClick={() => handleBlockUser(user.id)} icon={UserX} label="Block" color="red" />
          )}
          {!user.is_active && !user.is_blocked && (
            <ActionBtn onClick={() => handleActivateUser(user.id)} icon={UserCheck} label="Activate" color="blue" />
          )}
          <ActionBtn onClick={() => handleEditUser(user)} icon={Edit2} label="Edit" color="gray" />
          <ActionBtn
            onClick={() => { if (window.confirm('Delete this user? This cannot be undone.')) handleDeleteUser(user.id); }}
            icon={Trash2} label="Delete" color="red"
          />
        </div>
      </PopoverContent>
    </Popover>
  );

  // ── Empty / loading states ───────────────────────────────────────────────

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-50 p-6 rounded-full mb-5">
        <Search className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No users found</h3>
      <p className="text-gray-500 max-w-sm mb-6 text-sm">
        {searchTerm || roleFilter || classFilter
          ? 'No users match your search criteria.'
          : 'There are currently no users in the system.'}
      </p>
      {(searchTerm || roleFilter || classFilter) && (
        <button
          onClick={() => { setSearchTerm(''); setRoleFilter(''); setClassFilter(''); }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Clear Filters
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 font-medium">Loading users...</p>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  const TABLE_COLS = [
    { label: 'Name',        key: 'full_name',   minW: '150px' },
    { label: 'Email',       key: 'email',       minW: '180px' },
    { label: 'Role',        key: 'role',        minW: '120px' },
    { label: 'Status',      key: null,          minW: '100px' },
    { label: 'Last Login',  key: 'last_login',  minW: '140px' },
    { label: 'Date Joined', key: 'date_joined', minW: '140px' },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-9xl mt-4 sm:mt-6 lg:mt-8 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
        <Link to="/dashboard/users/create-user">
          <Button className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all">
            <PlusCircle className="w-4 h-4 mr-2" /> Create User
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 lg:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Users
            <span className="ml-2 text-sm font-medium text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'record' : 'records'}
            </span>
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text" placeholder="Search users..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); if (e.target.value !== 'student') setClassFilter(''); }}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
                >
                  <option value="">All Roles</option>
                  <option value="no_role">No Role</option>
                  {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
              </div>
            </div>
            {roleFilter === 'student' && (
              <div className="relative">
                <select
                  value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[120px]"
                >
                  <option value="">All Classes</option>
                  {CLASS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {isLoading ? <LoadingState /> : filteredUsers.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {TABLE_COLS.map(({ label, key, minW }) => (
                    <th
                      key={label}
                      className={`px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${key ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
                      style={{ minWidth: minW }}
                      onClick={() => key && requestSort(key)}
                    >
                      <div className="flex items-center">{label}{key && getSortIcon(key)}</div>
                    </th>
                  ))}
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px] sticky right-0 bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0">
                    <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="truncate max-w-[150px]" title={`${user.first_name} ${user.last_name}`}>
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-800">
                      <div className="truncate max-w-[180px]" title={user.email}>{user.email}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">{getRoleBadge(user)}</td>
                    <td className="px-4 lg:px-6 py-4">{getStatusBadge(user)}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDateTime(user.last_login) || 'Never'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(user.date_joined)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right sticky right-0">
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
        selectedUser?.role === 'student' ? (
          <EditStudentModal
            formData={formData} setFormData={setFormData}
            guardians={editGuardians} setGuardians={setEditGuardians}
            onSave={handleSaveUser} onClose={() => { setEditMode(false); setSaveError(null); }}
            saveError={saveError}
          />
        ) : (
          <EditUserModal
            formData={formData} setFormData={setFormData}
            handleSaveUser={handleSaveUser} setEditMode={setEditMode}
            saveError={saveError}
          />
        )
      )}
    </div>
  );
};

// ── ActionBtn helper ───────────────────────────────────────────────────────

const COLOR_MAP = {
  green: 'text-green-600 hover:bg-green-50',
  red:   'text-red-600 hover:bg-red-50',
  blue:  'text-blue-600 hover:bg-blue-50',
  gray:  'text-gray-700 hover:bg-gray-100',
};

const ActionBtn = ({ onClick, icon: Icon, label, color }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${COLOR_MAP[color]}`}>
    <Icon className="h-4 w-4" /> {label}
  </button>
);

export default UserManagement;