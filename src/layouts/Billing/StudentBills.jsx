// src/components/StudentBills.jsx
import React, { useEffect, useState } from "react";
import { fetchBills, deleteBill } from "../../services/billingService";
import { Link } from "react-router-dom";
import {
  Search, MoreHorizontal, Trash2, PlusCircle, RefreshCw, FileEdit,
  Filter, ChevronDown, ChevronUp, BookOpen, Clock, GraduationCap,
  Calendar, X
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

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    filterAndSortBills();
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
            )}

            {/* Results Summary */}
            {hasActiveFilters() && (
              <div className="flex justify-between items-center pt-2 text-xs text-gray-500">
                <span>Showing {filteredBills.length} result{filteredBills.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

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