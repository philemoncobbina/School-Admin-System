import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchBillDetail, 
  updateBill, 
  deleteBill, 
  createBillPaymentReceipt,
  updatePaymentReceipt,
  deletePaymentReceipt,
  fetchBillLogs
} from "../../services/billingService";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, DollarSign, User, FileText, History, Receipt, CheckCircle, List, Percent } from 'lucide-react';

// Message Component
const Message = ({ type, message, onClose }) => (
  <div className={`${type === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'} border rounded-md p-4 mb-4 flex items-center justify-between`}>
    <div className="flex items-center">
      {type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <X className="w-5 h-5 mr-2" />}
      <p>{message}</p>
    </div>
    <button onClick={onClose} className="hover:opacity-70"><X className="w-4 h-4" /></button>
  </div>
);

// Form Input Component
const FormInput = ({ label, required, error, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input {...props} className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-gray-300'}`} />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Status Badge Component
const StatusBadge = ({ status, type = 'bill' }) => {
  const colors = type === 'bill' 
    ? { 'DRAFT': 'bg-gray-100 text-gray-800', 'SCHEDULED': 'bg-yellow-100 text-yellow-800', 'PUBLISHED': 'bg-green-100 text-green-800' }
    : { 'pending': 'bg-red-100 text-red-800', 'partial': 'bg-yellow-100 text-yellow-800', 'paid': 'bg-green-100 text-green-800', 'overdue': 'bg-red-100 text-red-800' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
    {type === 'payment' ? status.charAt(0).toUpperCase() + status.slice(1) : status}
  </span>;
};

// Tab Navigation Component
const TabNav = ({ activeTab, setActiveTab, tabs }) => (
  <div className="border-b border-gray-200">
    <nav className="flex space-x-8">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
          activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}>
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  </div>
);

// Main Component
const StudentBillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [editingBill, setEditingBill] = useState(false);
  const [billForm, setBillForm] = useState({});
  const [customCharges, setCustomCharges] = useState([]);
  const [paymentReceipts, setPaymentReceipts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newCharge, setNewCharge] = useState({ charge_name: '', description: '', amount: '' });
  const [newReceipt, setNewReceipt] = useState({ receipt_number: '', amount_paid: '', payment_method: 'cash', notes: '' });
  const [addingCharge, setAddingCharge] = useState(false);
  const [addingReceipt, setAddingReceipt] = useState(false);
  const [editingChargeId, setEditingChargeId] = useState(null);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountForm, setDiscountForm] = useState({ discount_amount: '', discount_reason: '', discount_approved_by: '' });

  // Utilities
  const showMessage = useCallback((type, msg) => {
    setMessage({ type, text: msg });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const formatCurrency = (amount) => `GHS ${parseFloat(amount || 0).toFixed(2)}`;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : '';
  const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleString() : '';
  
  const toDateTimeLocal = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const toISODateTime = (dateTimeLocal) => {
    if (!dateTimeLocal) return null;
    const date = new Date(dateTimeLocal);
    return isNaN(date.getTime()) ? null : date.toISOString();
  };

  // Load Bill Data
  const loadBillDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchBillDetail(id);
      const billData = response.data;
      
      setBill(billData);
      setBillForm({
        discount_amount: billData.discount_amount || '0.00',
        status: billData.status || 'DRAFT',
        notes: billData.notes || '',
        due_date: billData.due_date || '',
        scheduled_date: billData.scheduled_date || ''
      });
      
      setDiscountForm({
        discount_amount: billData.discount_amount || '0.00',
        discount_reason: billData.discount_reason || '',
        discount_approved_by: billData.discount_approved_by || ''
      });
      
      setCustomCharges((billData.custom_charges || []).map(charge => ({
        id: charge.id,
        charge_name: charge.charge_name || '',
        description: charge.description || '',
        amount: String(charge.amount || '0.00')
      })));
      
      setPaymentReceipts(billData.payment_receipts || []);
      
      try {
        const logsResponse = await fetchBillLogs(id);
        setLogs(logsResponse.data || []);
      } catch {
        setLogs([]);
      }
    } catch {
      showMessage('error', 'Failed to load bill details');
    } finally {
      setLoading(false);
    }
  }, [id, showMessage]);

  useEffect(() => { loadBillDetail(); }, [loadBillDetail]);

  // Prepare Update Data
  const prepareUpdateData = (chargesOverride = null) => {
    const charges = chargesOverride || customCharges;
    return {
      discount_amount: parseFloat(billForm.discount_amount || 0).toFixed(2),
      status: billForm.status,
      notes: billForm.notes || '',
      due_date: billForm.due_date || bill.due_date || '',
      custom_charges: charges.map(charge => ({
        id: charge.id,
        charge_name: charge.charge_name,
        description: charge.description || '',
        amount: parseFloat(charge.amount).toFixed(2)
      })),
      ...(billForm.status === 'SCHEDULED' && billForm.scheduled_date && { 
        scheduled_date: toISODateTime(billForm.scheduled_date) 
      })
    };
  };

  // Bill Operations
  const handleBillUpdate = async () => {
    try {
      if (billForm.status === 'SCHEDULED' && !billForm.scheduled_date) {
        showMessage('error', 'Scheduled date and time is required for scheduled bills');
        return;
      }

      const discountAmount = parseFloat(billForm.discount_amount || 0);
      if (isNaN(discountAmount) || discountAmount < 0) {
        showMessage('error', 'Discount amount must be a valid positive number');
        return;
      }

      if (!billForm.due_date && !bill.due_date) {
        showMessage('error', 'Due date is required');
        return;
      }

      await updateBill(id, prepareUpdateData());
      await loadBillDetail();
      setEditingBill(false);
      showMessage('success', 'Bill updated successfully!');
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to update bill';
      
      if (errorData) {
        if (typeof errorData === 'object' && !errorData.message && !errorData.detail) {
          const errorMessages = Object.entries(errorData).map(([field, messages]) => 
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          );
          if (errorMessages.length > 0) errorMessage = errorMessages.join('; ');
        } else {
          errorMessage = errorData.message || errorData.detail || errorMessage;
        }
      }
      showMessage('error', err.message || errorMessage);
    }
  };

  const handleBillDelete = async () => {
    try {
      await deleteBill(id);
      showMessage('success', 'Bill deleted successfully!');
      setTimeout(() => navigate('/bills'), 1000);
    } catch {
      showMessage('error', 'Failed to delete bill');
    }
  };

  // Discount Operations
  const handleDiscountUpdate = async () => {
    try {
      const discountAmount = parseFloat(discountForm.discount_amount || 0);
      
      if (isNaN(discountAmount) || discountAmount < 0) {
        showMessage('error', 'Discount amount must be a valid positive number');
        return;
      }

      if (discountAmount > 0) {
        if (!discountForm.discount_reason || !discountForm.discount_reason.trim()) {
          showMessage('error', 'Discount reason is required when applying a discount');
          return;
        }
        if (!discountForm.discount_approved_by || !discountForm.discount_approved_by.trim()) {
          showMessage('error', 'Approved by is required when applying a discount');
          return;
        }
      }

      const updateData = {
        discount_amount: discountAmount.toFixed(2),
        discount_reason: discountForm.discount_reason.trim(),
        discount_approved_by: discountForm.discount_approved_by.trim(),
        status: bill.status,
        notes: bill.notes || '',
        due_date: bill.due_date,
        custom_charges: customCharges.map(charge => ({
          id: charge.id,
          charge_name: charge.charge_name,
          description: charge.description || '',
          amount: parseFloat(charge.amount).toFixed(2)
        }))
      };

      await updateBill(id, updateData);
      await loadBillDetail();
      setEditingDiscount(false);
      showMessage('success', 'Discount updated successfully!');
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to update discount';
      
      if (errorData) {
        if (typeof errorData === 'object' && !errorData.message && !errorData.detail) {
          const errorMessages = Object.entries(errorData).map(([field, messages]) => 
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          );
          if (errorMessages.length > 0) errorMessage = errorMessages.join('; ');
        } else {
          errorMessage = errorData.message || errorData.detail || errorMessage;
        }
      }
      showMessage('error', err.message || errorMessage);
    }
  };

  // Charge Operations
  const handleChargeOperation = async (operation, chargeData = null, chargeId = null) => {
    try {
      let updatedCharges;
      
      if (operation === 'add') {
        const { charge_name, description, amount } = chargeData;
        if (!charge_name.trim()) throw new Error('Charge name is required');
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) throw new Error('Amount must be a valid positive number');
        updatedCharges = [...customCharges, { charge_name, description: description.trim(), amount: parseFloat(amount).toFixed(2) }];
      } else if (operation === 'edit') {
        const { charge_name, description, amount } = chargeData;
        if (!charge_name.trim()) throw new Error('Charge name is required');
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) throw new Error('Amount must be a valid positive number');
        updatedCharges = customCharges.map(charge => 
          charge.id === chargeId ? { id: charge.id, charge_name, description: description.trim(), amount: parseFloat(amount).toFixed(2) } : charge
        );
      } else if (operation === 'delete') {
        updatedCharges = customCharges.filter(charge => charge.id !== chargeId);
      }
      
      await updateBill(id, prepareUpdateData(updatedCharges));
      await loadBillDetail();
      
      if (operation === 'add') {
        setNewCharge({ charge_name: '', description: '', amount: '' });
        setAddingCharge(false);
      } else {
        setEditingChargeId(null);
      }
      
      showMessage('success', `Custom charge ${operation === 'add' ? 'added' : operation === 'edit' ? 'updated' : 'deleted'} successfully!`);
    } catch (err) {
      showMessage('error', err.message || `Failed to ${operation} custom charge`);
    }
  };

  // Receipt Operations
  const handleReceiptOperation = async (operation, receiptData = null, receiptId = null) => {
    try {
      if (operation === 'add' || operation === 'edit') {
        const { receipt_number, amount_paid, payment_method, notes } = receiptData;
        if (!receipt_number.trim()) throw new Error('Receipt number is required');
        if (isNaN(parseFloat(amount_paid)) || parseFloat(amount_paid) <= 0) throw new Error('Amount paid must be a valid positive number');
        
        const data = {
          receipt_number: receipt_number.trim(),
          amount_paid: parseFloat(amount_paid),
          payment_method: payment_method || 'cash',
          notes: notes.trim(),
          student_bill: parseInt(id)
        };
        
        if (operation === 'add') {
          await createBillPaymentReceipt(id, data);
          setNewReceipt({ receipt_number: '', amount_paid: '', payment_method: 'cash', notes: '' });
          setAddingReceipt(false);
        } else {
          await updatePaymentReceipt(receiptId, data);
          setEditingReceiptId(null);
        }
      } else if (operation === 'delete') {
        await deletePaymentReceipt(receiptId);
      }
      
      await loadBillDetail();
      showMessage('success', `Payment receipt ${operation === 'add' ? 'added' : operation === 'edit' ? 'updated' : 'deleted'} successfully!`);
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = `Failed to ${operation} payment receipt`;
      if (errorData?.receipt_number && Array.isArray(errorData.receipt_number)) {
        errorMessage = errorData.receipt_number[0];
      } else if (errorData?.detail || errorData?.message) {
        errorMessage = errorData.detail || errorData.message;
      }
      showMessage('error', err.message || errorMessage);
    }
  };

  // Loading & Error States
  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bill details...</p>
      </div>
    </div>
  );
  
  if (!bill) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-red-600">Bill not found</p>
    </div>
  );

  // Calculate Totals
  const billingItems = bill.billing_template?.billing_items || [];
  const totalBillingItems = billingItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCustomCharges = customCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
  
  // Get balance due from API response
  const balanceDue = bill.total_outstanding || bill.balance_due || 0;

  const tabs = [
    { id: 'details', label: 'Bill Details', icon: FileText },
    { id: 'charges', label: 'Custom Charges', icon: Plus },
    { id: 'payments', label: 'Payment Receipts', icon: Receipt },
    { id: 'discount', label: 'Discount', icon: Percent },
    { id: 'logs', label: 'Activity Logs', icon: History }
  ];

  return (
    <div className="max-w-9xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Details</h1>
          <p className="text-gray-600">Bill #{bill.bill_number}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setEditingBill(!editingBill)} variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />{editingBill ? 'Cancel' : 'Edit Bill'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBillDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {message && <Message type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><User className="w-5 h-5 mr-2" />Student Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-medium">{bill.first_name} {bill.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Class & Term</label>
                  <p>{bill.billing_template?.class_name} - {bill.billing_template?.term}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Academic Year</label>
                  <p>{bill.billing_template?.academic_year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex space-x-2">
                    <StatusBadge status={bill.status} />
                    <StatusBadge status={bill.payment_status} type="payment" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center"><DollarSign className="w-5 h-5 mr-2" />Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Previous Arrears</span><span className="font-medium">{formatCurrency(bill.previous_arrears)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Current Bill</span><span className="font-medium">{formatCurrency(bill.total_amount_due)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Paid</span><span className="font-medium text-green-600">{formatCurrency(bill.total_paid)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="font-medium text-blue-600">-{formatCurrency(bill.discount_amount)}</span></div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Balance Due</span>
                  <span className={parseFloat(balanceDue) > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(balanceDue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><List className="w-5 h-5 mr-2" />Billing Items</CardTitle></CardHeader>
              <CardContent>
                {billingItems.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No items found</p>
                ) : (
                  <div className="space-y-3">
                    {billingItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start border-b pb-2">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(totalBillingItems)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center"><Plus className="w-5 h-5 mr-2" />Custom Charges</CardTitle></CardHeader>
              <CardContent>
                {customCharges.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No charges added</p>
                ) : (
                  <div className="space-y-3">
                    {customCharges.map((charge) => (
                      <div key={charge.id} className="flex justify-between items-start border-b pb-2">
                        <div>
                          <p className="font-medium">{charge.charge_name}</p>
                          {charge.description && <p className="text-sm text-gray-500">{charge.description}</p>}
                        </div>
                        <p className="font-medium">{formatCurrency(charge.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(totalCustomCharges)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {editingBill && (
            <Card>
              <CardHeader><CardTitle>Edit Bill</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="Discount" type="number" step="0.01" min="0" value={billForm.discount_amount} onChange={(e) => setBillForm({...billForm, discount_amount: e.target.value})} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={billForm.status} onChange={(e) => setBillForm({...billForm, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="DRAFT">Draft</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <FormInput label="Due Date" type="date" value={billForm.due_date} onChange={(e) => setBillForm({...billForm, due_date: e.target.value})} />
                </div>
                {billForm.status === 'SCHEDULED' && (
                  <FormInput label="Scheduled Date & Time" type="datetime-local" required value={toDateTimeLocal(billForm.scheduled_date)} onChange={(e) => setBillForm({...billForm, scheduled_date: e.target.value})} />
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows="3" value={billForm.notes} onChange={(e) => setBillForm({...billForm, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Notes..." />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleBillUpdate}><Save className="w-4 h-4 mr-2" />Save</Button>
                  <Button variant="outline" onClick={() => setEditingBill(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === 'charges' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Custom Charges</CardTitle>
              <Button onClick={() => setAddingCharge(true)}><Plus className="w-4 h-4 mr-2" />Add</Button>
            </div>
          </CardHeader>
          <CardContent>
            {addingCharge && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-4">Add Charge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Name" required value={newCharge.charge_name} onChange={(e) => setNewCharge({...newCharge, charge_name: e.target.value})} placeholder="Late Fee" />
                  <FormInput label="Amount" type="number" step="0.01" min="0" required value={newCharge.amount} onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})} placeholder="0.00" />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows="2" value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Optional..." />
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button onClick={() => handleChargeOperation('add', newCharge)}><Save className="w-4 h-4 mr-2" />Add</Button>
                  <Button variant="outline" onClick={() => { setAddingCharge(false); setNewCharge({ charge_name: '', description: '', amount: '' }); }}><X className="w-4 h-4 mr-2" />Cancel</Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customCharges.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No charges added</td></tr>
                  ) : customCharges.map((charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 text-sm">
                        {editingChargeId === charge.id ? (
                          <input type="text" value={editFormData.charge_name} onChange={(e) => setEditFormData({...editFormData, charge_name: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        ) : charge.charge_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {editingChargeId === charge.id ? (
                          <textarea rows="1" value={editFormData.description || ''} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        ) : charge.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {editingChargeId === charge.id ? (
                          <input type="number" step="0.01" min="0" value={editFormData.amount} onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        ) : formatCurrency(charge.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          {editingChargeId === charge.id ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleChargeOperation('edit', editFormData, charge.id)}><Save className="w-4 h-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingChargeId(null)}><X className="w-4 h-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => { setEditingChargeId(charge.id); setEditFormData(charge); }}><Edit className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Charge</AlertDialogTitle>
                                    <AlertDialogDescription>Delete "{charge.charge_name}"?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleChargeOperation('delete', null, charge.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Receipts</CardTitle>
              <Button onClick={() => setAddingReceipt(true)}><Plus className="w-4 h-4 mr-2" />Add</Button>
            </div>
          </CardHeader>
          <CardContent>
            {addingReceipt && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-4">Add Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Receipt #" required value={newReceipt.receipt_number} onChange={(e) => setNewReceipt({...newReceipt, receipt_number: e.target.value})} placeholder="REC001" />
                  <FormInput label="Amount" type="number" step="0.01" min="0" required value={newReceipt.amount_paid} onChange={(e) => setNewReceipt({...newReceipt, amount_paid: e.target.value})} placeholder="0.00" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <select value={newReceipt.payment_method} onChange={(e) => setNewReceipt({...newReceipt, payment_method: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows="2" value={newReceipt.notes} onChange={(e) => setNewReceipt({...newReceipt, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Optional..." />
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button onClick={() => handleReceiptOperation('add', newReceipt)}><Save className="w-4 h-4 mr-2" />Add</Button>
                  <Button variant="outline" onClick={() => { setAddingReceipt(false); setNewReceipt({ receipt_number: '', amount_paid: '', payment_method: 'cash', notes: '' }); }}><X className="w-4 h-4 mr-2" />Cancel</Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentReceipts.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No payments recorded</td></tr>
                  ) : paymentReceipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-6 py-4 text-sm">
                        {editingReceiptId === receipt.id ? (
                          <input type="text" value={editFormData.receipt_number} onChange={(e) => setEditFormData({...editFormData, receipt_number: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        ) : receipt.receipt_number}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {editingReceiptId === receipt.id ? (
                          <input type="number" step="0.01" min="0" value={editFormData.amount_paid} onChange={(e) => setEditFormData({...editFormData, amount_paid: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        ) : formatCurrency(receipt.amount_paid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {editingReceiptId === receipt.id ? (
                          <select value={editFormData.payment_method} onChange={(e) => setEditFormData({...editFormData, payment_method: e.target.value})} className="w-full px-2 py-1 border border-gray-300 rounded">
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                          </select>
                        ) : receipt.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(receipt.payment_date)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          {editingReceiptId === receipt.id ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleReceiptOperation('edit', editFormData, receipt.id)}><Save className="w-4 h-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingReceiptId(null)}><X className="w-4 h-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => { setEditingReceiptId(receipt.id); setEditFormData(receipt); }}><Edit className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
                                    <AlertDialogDescription>Delete receipt "{receipt.receipt_number}"?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleReceiptOperation('delete', null, receipt.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><p className="text-sm text-gray-600">Total Receipts</p><p className="text-lg font-medium">{paymentReceipts.length}</p></div>
                <div><p className="text-sm text-gray-600">Total Paid</p><p className="text-lg font-medium text-green-600">{formatCurrency(bill.total_paid)}</p></div>
                <div><p className="text-sm text-gray-600">Balance</p><p className={`text-lg font-medium ${parseFloat(balanceDue) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balanceDue)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discount Tab */}
      {activeTab === 'discount' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center"><Percent className="w-5 h-5 mr-2" />Discount Information</CardTitle>
              {!editingDiscount && (
                <Button onClick={() => setEditingDiscount(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />Edit Discount
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editingDiscount ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-600">Discount Amount</label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(bill.discount_amount)}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-600">Amount After Discount</label>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {formatCurrency((parseFloat(totalBillingItems) + parseFloat(totalCustomCharges) - parseFloat(bill.discount_amount)))}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <label className="text-sm font-medium text-gray-600">Discount Reason</label>
                    <p className="text-base text-gray-800 mt-1">
                      {bill.discount_reason || <span className="text-gray-400 italic">No reason provided</span>}
                    </p>
                  </div>

                  <div className="border-b pb-3">
                    <label className="text-sm font-medium text-gray-600">Approved By</label>
                    <p className="text-base text-gray-800 mt-1">
                      {bill.discount_approved_by || <span className="text-gray-400 italic">Not specified</span>}
                    </p>
                  </div>
                </div>

                {parseFloat(bill.discount_amount) === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                    <Percent className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">No Discount Applied</p>
                      <p className="text-sm text-yellow-700 mt-1">Click "Edit Discount" to apply a discount to this bill.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> When applying a discount, you must provide both a reason and the name of the person who approved it.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput 
                    label="Discount Amount" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required={parseFloat(discountForm.discount_amount) > 0}
                    value={discountForm.discount_amount} 
                    onChange={(e) => setDiscountForm({...discountForm, discount_amount: e.target.value})} 
                    placeholder="0.00"
                  />
                  <FormInput 
                    label="Approved By" 
                    type="text" 
                    required={parseFloat(discountForm.discount_amount) > 0}
                    value={discountForm.discount_approved_by} 
                    onChange={(e) => setDiscountForm({...discountForm, discount_approved_by: e.target.value})} 
                    placeholder="Enter approver's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Reason {parseFloat(discountForm.discount_amount) > 0 && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                    rows="4" 
                    value={discountForm.discount_reason} 
                    onChange={(e) => setDiscountForm({...discountForm, discount_reason: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Provide a detailed reason for the discount..."
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Original Amount:</span>
                      <span className="font-medium ml-2">{formatCurrency(parseFloat(totalBillingItems) + parseFloat(totalCustomCharges))}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount After Discount:</span>
                      <span className="font-bold text-blue-600 ml-2">
                        {formatCurrency(Math.max(0, (parseFloat(totalBillingItems) + parseFloat(totalCustomCharges) - parseFloat(discountForm.discount_amount || 0))))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button onClick={handleDiscountUpdate}><Save className="w-4 h-4 mr-2" />Save Discount</Button>
                  <Button variant="outline" onClick={() => {
                    setEditingDiscount(false);
                    setDiscountForm({
                      discount_amount: bill.discount_amount || '0.00',
                      discount_reason: bill.discount_reason || '',
                      discount_approved_by: bill.discount_approved_by || ''
                    });
                  }}><X className="w-4 h-4 mr-2" />Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center"><History className="w-5 h-5 mr-2" />Activity Logs</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex space-x-2 mb-2">
                          <span className="text-sm font-medium">{log.user_first_name} {log.user_last_name}</span>
                          <span className="text-xs text-gray-500">({log.user_email})</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Changed {(log.field_name || '').replace(/_/g, ' ')}:</span>
                          <div className="mt-1 pl-4 border-l-2 border-gray-200">
                            {log.old_value && <div className="text-red-600"><span className="text-xs text-gray-500">From:</span> {log.old_value}</div>}
                            <div className="text-green-600"><span className="text-xs text-gray-500">To:</span> {log.new_value || '(empty)'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{formatDate(log.timestamp)}</div>
                        <div className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentBillDetail;