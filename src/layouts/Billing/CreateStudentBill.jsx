import React, { useEffect, useState } from "react";
import { 
  fetchTemplates, 
  createBill,
  fetchStudentsByClass 
} from "../../services/billingService";

const CreateStudentBill = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  
  const [form, setForm] = useState({
    student: "",
    billing_template: "",
    status: "DRAFT",
    scheduled_date: "",
    due_date: "",
    notes: ""
  });

  // Payment receipts management
  const [paymentReceipts, setPaymentReceipts] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    receipt_number: "",
    amount_paid: "0.00",
    payment_method: "cash",
    payment_date: "",
    notes: ""
  });

  // Check if both template and student are selected
  const isFormReady = form.billing_template && form.student;

  useEffect(() => {
    loadTemplates();
    // Set default payment date to today
    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 16);
    setCurrentPayment(prev => ({ ...prev, payment_date: formattedDate }));
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetchTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      setErrors({ general: "Failed to load templates. Please refresh the page." });
    }
  };

  const loadStudentsByClass = async (className) => {
    if (!className) {
      setStudents([]);
      return;
    }

    setStudentsLoading(true);
    try {
      const res = await fetchStudentsByClass(className);
      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students:", error);
      setErrors({ general: "Failed to load students for this class. Please try again." });
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id.toString() === templateId);
    setSelectedTemplate(template);
    
    // Reset student selection when template changes
    setForm(prev => ({
      ...prev,
      billing_template: templateId,
      student: "",
      due_date: template ? template.due_date : ""
    }));

    // Load students for the selected template's class
    if (template) {
      loadStudentsByClass(template.class_name);
    } else {
      setStudents([]);
    }
  };

  // Payment Receipts Management
  const addPaymentReceipt = () => {
    if (!currentPayment.receipt_number.trim() || !currentPayment.amount_paid || parseFloat(currentPayment.amount_paid) <= 0) {
      setErrors({ paymentReceipt: "Please enter a valid receipt number and amount greater than 0." });
      return;
    }

    // Check if receipt number already exists
    const exists = paymentReceipts.some(receipt => 
      receipt.receipt_number.toLowerCase() === currentPayment.receipt_number.toLowerCase()
    );
    
    if (exists) {
      setErrors({ paymentReceipt: "A receipt with this number already exists. Please use a unique receipt number." });
      return;
    }

    setPaymentReceipts([...paymentReceipts, { ...currentPayment, id: Date.now() }]);
    setCurrentPayment({
      receipt_number: "",
      amount_paid: "0.00",
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 16),
      notes: ""
    });
    setErrors({ ...errors, paymentReceipt: "" });
  };

  const removePaymentReceipt = (id) => {
    setPaymentReceipts(paymentReceipts.filter(receipt => receipt.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Prepare form data
      const formData = {
        ...form,
        scheduled_date: form.scheduled_date || null,
        payment_receipts: paymentReceipts.map(receipt => ({
          receipt_number: receipt.receipt_number,
          amount_paid: parseFloat(receipt.amount_paid),
          payment_method: receipt.payment_method,
          payment_date: receipt.payment_date,
          notes: receipt.notes
        }))
      };

      const response = await createBill(formData);
      
      // Check if the response indicates success
      if (response.data && (response.data.success || response.data.id)) {
        setSuccessMessage(response.data.message || "Student bill created successfully!");
        
        // Reset form
        resetForm();
      } else {
        // Handle case where success is false
        if (response.data && response.data.message) {
          setErrors({ general: response.data.message });
        } else {
          setErrors({ general: "Failed to create student bill. Please try again." });
        }
      }

    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle the new error response format
        if (errorData.success === false) {
          if (errorData.message) {
            // Handle general error message
            setErrors({ general: errorData.message });
          } else {
            setErrors({ general: "Failed to create student bill. Please try again." });
          }
        } else if (errorData.errors) {
          // Handle field-specific errors
          setErrors(errorData.errors);
        } else if (errorData.message) {
          // Handle general error message
          setErrors({ general: errorData.message });
        } else {
          // Fallback for unexpected error format
          setErrors({ general: "Failed to create student bill. Please try again." });
        }
      } else {
        setErrors({ general: "Failed to create student bill. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedTotal = () => {
    if (!selectedTemplate) return 0;
    
    const baseAmount = selectedTemplate.billing_items ? 
      selectedTemplate.billing_items.reduce((sum, item) => sum + parseFloat(item.amount), 0) : 0;
    
    const totalPayments = paymentReceipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount_paid), 0);
    
    const totalDue = baseAmount;
    const balanceDue = totalDue - totalPayments;
    
    return { totalDue, totalPayments, balanceDue };
  };

  const resetForm = () => {
    setForm({
      student: "",
      billing_template: "",
      status: "DRAFT",
      scheduled_date: "",
      due_date: "",
      notes: ""
    });
    setSelectedTemplate(null);
    setStudents([]);
    setPaymentReceipts([]);
    setCurrentPayment({
      receipt_number: "",
      amount_paid: "0.00",
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 16),
      notes: ""
    });
    setErrors({});
    // Don't clear success message on reset
  };

  const { totalDue, totalPayments, balanceDue } = calculateEstimatedTotal();

  return (
    <div className="p-6 max-w-9xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Student Bill</h2>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
          <div className="mt-2">
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-800 underline text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* General Error Message */}
      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {errors.general}
          </div>
        </div>
      )}

      {/* Non-field specific errors (like duplicate bill error) */}
      {errors.non_field_errors && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {Array.isArray(errors.non_field_errors) 
              ? errors.non_field_errors.join(', ') 
              : errors.non_field_errors
            }
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Template *
              </label>
              <select
                className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.billing_template ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.billing_template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                required
              >
                <option value="">-- Select Billing Template --</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.class_name} - {template.term} term ({template.academic_year})
                  </option>
                ))}
              </select>
              {errors.billing_template && (
                <p className="text-red-500 text-xs mt-1">{errors.billing_template}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <select
                className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.student ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.student}
                onChange={(e) => setForm({ ...form, student: e.target.value })}
                required
                disabled={!selectedTemplate || studentsLoading}
              >
                <option value="">
                  {studentsLoading 
                    ? "Loading students..." 
                    : selectedTemplate 
                      ? "-- Select Student --" 
                      : "-- Select Template First --"
                  }
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} - {student.email}
                  </option>
                ))}
              </select>
              {errors.student && (
                <p className="text-red-500 text-xs mt-1">{errors.student}</p>
              )}
              {selectedTemplate && students.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {students.length} students for {selectedTemplate.class_name.toUpperCase()}
                </p>
              )}
              {selectedTemplate && students.length === 0 && !studentsLoading && (
                <p className="text-sm text-amber-600 mt-1">
                  No students found for {selectedTemplate.class_name.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Template Details */}
        {selectedTemplate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Template Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Class:</span> {selectedTemplate.class_name.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Term:</span> {selectedTemplate.term} Term
              </div>
              <div>
                <span className="font-medium">Academic Year:</span> {selectedTemplate.academic_year}
              </div>
              <div>
                <span className="font-medium">Due Date:</span> {selectedTemplate.due_date}
              </div>
              <div>
                <span className="font-medium">Items Count:</span> {selectedTemplate.billing_items?.length || 0}
              </div>
              <div>
                <span className="font-medium">Base Amount:</span> GHS {selectedTemplate.billing_items ? 
                  selectedTemplate.billing_items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2) : '0.00'}
              </div>
            </div>

            {/* Show billing items */}
            {selectedTemplate.billing_items && selectedTemplate.billing_items.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Billing Items:</h4>
                <div className="bg-white rounded border p-3">
                  {selectedTemplate.billing_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                      <div>
                        <span className="font-medium text-sm">{item.item_name}</span>
                        <span className="text-xs text-gray-500 ml-2">({item.category})</span>
                      </div>
                      <span className="text-sm font-medium">GHS {parseFloat(item.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bill Summary - Only show when template and student are selected */}
        {isFormReady && selectedTemplate && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Amount Breakdown:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Amount (Template Items):</span>
                    <span>GHS {selectedTemplate.billing_items ? 
                      selectedTemplate.billing_items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount Due:</span>
                    <span>GHS {totalDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Payment Summary:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Payments:</span>
                    <span className="text-green-600">GHS {totalPayments.toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Balance Due:</span>
                    <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                      GHS {balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bill Settings - Only show when template and student are selected */}
        {isFormReady && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Bill Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  required
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.due_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                />
                {errors.due_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>
                )}
              </div>

              {form.status === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  />
                  {errors.scheduled_date && (
                    <p className="text-red-500 text-xs mt-1">{errors.scheduled_date}</p>
                  )}
                </div>
              )}

              <div className={form.status === 'SCHEDULED' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Additional notes for this bill"
                  className={`w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.notes ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                {errors.notes && (
                  <p className="text-red-500 text-xs mt-1">{errors.notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - Only show when template and student are selected */}
        {isFormReady && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={resetForm}
            >
              Reset
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating...' : 'Create Student Bill'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateStudentBill;