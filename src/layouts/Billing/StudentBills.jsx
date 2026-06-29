// src/components/StudentBills.jsx
import React, { useEffect, useState } from "react";
import { fetchBills, deleteBill, bulkPublishBills } from "../../services/billingService";
import { Link } from "react-router-dom";
import {
  Search, MoreHorizontal, Trash2, PlusCircle, RefreshCw, FileEdit,
  Filter, ChevronDown, ChevronUp, BookOpen, Clock, GraduationCap,
  Calendar, X, Send, AlertCircle, CheckCircle2, Info, ChevronRight
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const StudentBills = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    paymentStatus: "all",
    academicYear: "all",
    class: "all",
    term: "all"
  });
  const [sort, setSort] = useState({ field: "created_at", order: "desc" });
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Bulk publish state
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { type: 'success' | 'error', data: ... }

  const STATUS_CHOICES = [
    { value: "DRAFT", label: "Draft" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "PUBLISHED", label: "Published" }
  ];

  const PAYMENT_STATUS_CHOICES = [
    { value: "pending", label: "Pending" },
    { value: "partial", label: "Partially Paid" },
    { value: "paid", label: "Fully Paid" },
    { value: "overdue", label: "Overdue" }
  ];

  // Get unique filter values
  const getUniqueValues = (field) => {
    const values = [...new Set(bills.map(bill => bill.billing_template?.[field]).filter(Boolean))];
    return values.sort();
  };

  // Check if all three bulk-publish fields are selected
  const bulkPublishReady =
    filters.academicYear !== "all" &&
    filters.class !== "all" &&
    filters.term !== "all";

  // Count how many of the three fields are filled
  const bulkFieldsSelected = [filters.academicYear, filters.class, filters.term]
    .filter(v => v !== "all").length;

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    filterAndSortBills();
    // Clear bulk result when filters change
    setBulkResult(null);
  }, [bills, filters, sort]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await fetchBills();
      setBills(res.data);
    } catch (error) {
      console.error("Error loading bills:", error);
      alert("Failed to load bills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBills = () => {
    let filtered = bills.filter(bill => {
      const searchMatch = !filters.search ||
        bill.bill_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        `${bill.first_name} ${bill.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        bill.billing_template?.academic_year?.toLowerCase().includes(filters.search.toLowerCase()) ||
        bill.billing_template?.class_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        bill.billing_template?.term?.toLowerCase().includes(filters.search.toLowerCase());

      const statusMatch = filters.status === "all" || bill.status === filters.status;
      const paymentMatch = filters.paymentStatus === "all" || bill.payment_status === filters.paymentStatus;
      const yearMatch = filters.academicYear === "all" || bill.billing_template?.academic_year === filters.academicYear;
      const classMatch = filters.class === "all" || bill.billing_template?.class_name === filters.class;
      const termMatch = filters.term === "all" || bill.billing_template?.term === filters.term;

      return searchMatch && statusMatch && paymentMatch && yearMatch && classMatch && termMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sort.field) {
        case "total_amount_due":
          aValue = parseFloat(a[sort.field]) || 0;
          bValue = parseFloat(b[sort.field]) || 0;
          break;
        case "academic_year":
          aValue = a.billing_template?.academic_year || "";
          bValue = b.billing_template?.academic_year || "";
          break;
        case "class_name":
          aValue = a.billing_template?.class_name || "";
          bValue = b.billing_template?.class_name || "";
          break;
        case "term":
          aValue = a.billing_template?.term || "";
          bValue = b.billing_template?.term || "";
          break;
        default:
          aValue = a[sort.field] || "";
          bValue = b[sort.field] || "";
      }

      return sort.order === "asc" ?
        (aValue > bValue ? 1 : -1) :
        (aValue < bValue ? 1 : -1);
    });

    setFilteredBills(filtered);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      paymentStatus: "all",
      academicYear: "all",
      class: "all",
      term: "all"
    });
    setBulkResult(null);
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleDelete = async (billId, billNumber) => {
    if (!window.confirm(`Are you sure you want to delete bill ${billNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(billId);
      await deleteBill(billId);
      setBills(prev => prev.filter(bill => bill.id !== billId));
      alert("Bill deleted successfully!");
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("Failed to delete bill. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleBulkPublish = async () => {
    const payload = {
      class_name: filters.class,
      term: filters.term,
      academic_year: filters.academicYear,
    };

    const confirmMsg =
      `Bulk publish all DRAFT and SCHEDULED bills for:\n\n` +
      `  Class: ${payload.class_name}\n` +
      `  Term: ${payload.term}\n` +
      `  Academic Year: ${payload.academic_year}\n\n` +
      `This will send PDF, email, and SMS notifications to each student. Continue?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setBulkPublishing(true);
      setBulkResult(null);
      const res = await bulkPublishBills(payload);
      setBulkResult({ type: 'success', data: res.data });
      await loadBills(); // Refresh list so statuses update
    } catch (error) {
      console.error("Bulk publish error:", error);
      const errData = error?.response?.data;
      setBulkResult({ type: 'error', data: errData });
    } finally {
      setBulkPublishing(false);
    }
  };

  const getBadge = (value, type) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-800",
      SCHEDULED: "bg-blue-100 text-blue-800",
      PUBLISHED: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-orange-100 text-orange-800",
      overdue: "bg-red-100 text-red-800"
    };

    const choices = type === 'status' ? STATUS_CHOICES : PAYMENT_STATUS_CHOICES;
    const label = choices.find(c => c.value === value)?.label || value;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[value] || "bg-gray-100 text-gray-800"}`}>
        {label}
      </span>
    );
  };

  const SortIcon = ({ field }) => {
    if (sort.field !== field) return null;
    return sort.order === "asc" ?
      <ChevronUp className="h-4 w-4" /> :
      <ChevronDown className="h-4 w-4" />;
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) =>
      key === 'search' ? value : value !== "all"
    );
  };

  const activeFilterCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'search') return count + (value ? 1 : 0);
      return count + (value !== "all" ? 1 : 0);
    }, 0);
  };

  const FilterSelect = ({ label, value, onChange, options, icon: Icon }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All {label}s</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  const TableHeader = ({ field, children, className = "" }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <SortIcon field={field} />
      </div>
    </th>
  );

  // ── Bulk result banners ──────────────────────────────────────────────────────

  const BulkSuccessBanner = ({ data }) => (
    <div className="mx-6 mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start space-x-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800">{data.message}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-green-700">
            <span>✓ {data.published_count} bill{data.published_count !== 1 ? 's' : ''} published</span>
            {data.already_published_count > 0 && (
              <span>· {data.already_published_count} already published (skipped)</span>
            )}
            <span>· {data.total_students_in_class} student{data.total_students_in_class !== 1 ? 's' : ''} in class</span>
          </div>
        </div>
        <button
          onClick={() => setBulkResult(null)}
          className="text-green-500 hover:text-green-700 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const BulkErrorBanner = ({ data }) => {
    if (!data) {
      return (
        <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">Bulk publish failed. Please try again.</p>
            <button onClick={() => setBulkResult(null)} className="text-red-400 hover:text-red-600 ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    const errors = data?.errors || {};
    const missingBills = errors?.missing_bills;
    const billingTemplate = errors?.billing_template;
    const students = errors?.students;
    const otherErrors = Object.entries(errors).filter(
      ([key]) => !['missing_bills', 'billing_template', 'students'].includes(key)
    );

    return (
      <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {data?.message || "Bulk publishing failed validation."}
            </p>

            {/* Missing bills block */}
            {missingBills && (
              <div className="mt-3">
                <p className="text-sm text-red-700">{missingBills.message}</p>
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {missingBills.total_missing} student{missingBills.total_missing !== 1 ? 's' : ''} without a bill:
                </p>
                <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {missingBills.students.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center space-x-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1"
                    >
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-red-500">·</span>
                      <span>{s.email}</span>
                      <span className="text-red-500">·</span>
                      <span>{s.class_name}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2">
                  Create bills for these students first, then try bulk publishing again.
                </p>
              </div>
            )}

            {/* Template / students / other simple errors */}
            {billingTemplate && (
              <p className="text-sm text-red-700 mt-2">{billingTemplate}</p>
            )}
            {students && (
              <p className="text-sm text-red-700 mt-2">{students}</p>
            )}
            {otherErrors.map(([key, val]) => (
              <p key={key} className="text-sm text-red-700 mt-2">
                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                {typeof val === 'string' ? val : JSON.stringify(val)}
              </p>
            ))}
          </div>

          <button
            onClick={() => setBulkResult(null)}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-gray-600">Loading bills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Student Bills</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Total: {filteredBills.length} of {bills.length} bills</span>
              </div>
              <Button onClick={loadBills} variant="outline" size="sm" className="flex items-center space-x-1">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Link to="/dashboard/billing/create-student-bill">
                <Button className="flex items-center space-x-1" size="sm">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Bill</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Search Bar and Filter Toggle */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by bill number, student name, academic year, class, or term..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters() && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {activeFilterCount()}
                  </span>
                )}
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            {showFilters && (
              <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FilterSelect
                    label="Status"
                    value={filters.status}
                    onChange={(value) => updateFilter('status', value)}
                    options={STATUS_CHOICES}
                  />

                  <FilterSelect
                    label="Payment Status"
                    value={filters.paymentStatus}
                    onChange={(value) => updateFilter('paymentStatus', value)}
                    options={PAYMENT_STATUS_CHOICES}
                  />

                  <FilterSelect
                    label="Academic Year"
                    value={filters.academicYear}
                    onChange={(value) => updateFilter('academicYear', value)}
                    options={getUniqueValues('academic_year')}
                    icon={Calendar}
                  />

                  <FilterSelect
                    label="Class"
                    value={filters.class}
                    onChange={(value) => updateFilter('class', value)}
                    options={getUniqueValues('class_name')}
                    icon={GraduationCap}
                  />

                  <FilterSelect
                    label="Term"
                    value={filters.term}
                    onChange={(value) => updateFilter('term', value)}
                    options={getUniqueValues('term')}
                  />
                </div>

                {/* ── Bulk Publish hint + button ─────────────────────────────── */}
                {!bulkPublishReady && bulkFieldsSelected > 0 && (
                  <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                    <Info className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Select{' '}
                      {[
                        filters.academicYear === "all" && "Academic Year",
                        filters.class === "all" && "Class",
                        filters.term === "all" && "Term",
                      ]
                        .filter(Boolean)
                        .join(', ')}{' '}
                      to enable Bulk Publish.
                    </span>
                  </div>
                )}

                {bulkPublishReady && (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-md px-4 py-3">
                    <div className="flex items-center space-x-2 text-sm text-indigo-700">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Ready to bulk publish all DRAFT &amp; SCHEDULED bills for{' '}
                        <span className="font-semibold">{filters.class}</span>,{' '}
                        <span className="font-semibold">{filters.term}</span>,{' '}
                        <span className="font-semibold">{filters.academicYear}</span>.
                        PDFs, emails, and SMS will be sent to each student.
                      </span>
                    </div>
                    <Button
                      onClick={handleBulkPublish}
                      disabled={bulkPublishing}
                      size="sm"
                      className="ml-4 flex-shrink-0 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {bulkPublishing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Publishing…</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Bulk Publish</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Results Summary */}
            {hasActiveFilters() && (
              <div className="flex justify-between items-center pt-2 text-xs text-gray-500">
                <span>Showing {filteredBills.length} result{filteredBills.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Bulk publish result banners ── */}
        {bulkResult?.type === 'success' && (
          <BulkSuccessBanner data={bulkResult.data} />
        )}
        {bulkResult?.type === 'error' && (
          <BulkErrorBanner data={bulkResult.data} />
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader field="bill_number">Bill Number</TableHeader>
                <TableHeader field="first_name">Student</TableHeader>
                <TableHeader field="academic_year">Academic Year</TableHeader>
                <TableHeader field="class_name">Class</TableHeader>
                <TableHeader field="term">Term</TableHeader>
                <TableHeader field="status">Status</TableHeader>
                <TableHeader field="payment_status">Payment Status</TableHeader>
                <TableHeader field="total_amount_due">Amount Due</TableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {bills.length === 0 ? (
                        <>
                          <FileEdit className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No bills found</p>
                          <p className="text-sm">Get started by creating your first bill</p>
                        </>
                      ) : (
                        <>
                          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No matching bills</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{bill.bill_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bill.first_name} {bill.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{bill.billing_template?.academic_year || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center space-x-1">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span>{bill.billing_template?.class_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bill.billing_template?.term || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBadge(bill.status, 'status')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBadge(bill.payment_status, 'payment')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        GHS {parseFloat(bill.total_amount_due).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0 bg-white">
                          <div className="py-1">
                            <Link
                              to={`/dashboard/billing/bills/${bill.id}`}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <FileEdit className="h-4 w-4" />
                              <span>View Details</span>
                            </Link>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDelete(bill.id, bill.bill_number)}
                              disabled={deleteLoading === bill.id}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleteLoading === bill.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Bill</span>
                                </>
                              )}
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredBills.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Showing {filteredBills.length} of {bills.length} bills</span>
              <span>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBills;