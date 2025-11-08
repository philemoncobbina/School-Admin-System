// src/services/billingService.ts
import axios from "axios";

const API_URL = "http://localhost:8000/api"; // Adjust if different

// Helper function to get authorization headers
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }
  return { Authorization: `Bearer ${accessToken}` };
};

// Helper to get auth header configuration for axios
const getAuthHeader = () => {
  return {
    headers: getAuthHeaders()
  };
};

// --------------------
// Billing Templates
// --------------------
export const fetchTemplates = () => {
  return axios.get(`${API_URL}/templates/`, getAuthHeader());
};

export const createTemplate = (data: any) => {
  return axios.post(`${API_URL}/templates/`, data, getAuthHeader());
};

export const fetchTemplateDetail = (id: number) => {
  return axios.get(`${API_URL}/templates/${id}/`, getAuthHeader());
};

export const updateTemplate = (id: number, data: any) => {
  return axios.put(`${API_URL}/templates/${id}/`, data, getAuthHeader());
};

export const deleteTemplate = (id: number) => {
  return axios.delete(`${API_URL}/templates/${id}/`, getAuthHeader());
};

// --------------------
// Billing Items
// --------------------
export const fetchItems = () => {
  return axios.get(`${API_URL}/items/`, getAuthHeader());
};

export const createItem = (data: any) => {
  return axios.post(`${API_URL}/items/`, data, getAuthHeader());
};

export const fetchItemDetail = (id: number) => {
  return axios.get(`${API_URL}/items/${id}/`, getAuthHeader());
};

export const updateItem = (id: number, data: any) => {
  return axios.put(`${API_URL}/items/${id}/`, data, getAuthHeader());
};

export const deleteItem = (id: number) => {
  return axios.delete(`${API_URL}/items/${id}/`, getAuthHeader());
};

// Billing Item Logs
export const fetchItemLogs = (billingItemId: number) => {
  return axios.get(`${API_URL}/items/${billingItemId}/logs/`, getAuthHeader());
};

// --------------------
// Payment Receipts
// --------------------
export const fetchPaymentReceipts = () => {
  return axios.get(`${API_URL}/payment-receipts/`, getAuthHeader());
};

export const fetchBillPaymentReceipts = (billId: number) => {
  return axios.get(`${API_URL}/bills/${billId}/payment-receipts/`, getAuthHeader());
};

export const createPaymentReceipt = (data: any) => {
  return axios.post(`${API_URL}/payment-receipts/`, data, getAuthHeader());
};

export const createBillPaymentReceipt = (billId: number, data: any) => {
  return axios.post(`${API_URL}/bills/${billId}/payment-receipts/`, data, getAuthHeader());
};

export const fetchPaymentReceiptDetail = (id: number) => {
  return axios.get(`${API_URL}/payment-receipts/${id}/`, getAuthHeader());
};

export const updatePaymentReceipt = (id: number, data: any) => {
  return axios.put(`${API_URL}/payment-receipts/${id}/`, data, getAuthHeader());
};

export const deletePaymentReceipt = (id: number) => {
  return axios.delete(`${API_URL}/payment-receipts/${id}/`, getAuthHeader());
};

// --------------------
// Students
// --------------------
export const fetchStudents = () => {
  return axios.get(`${API_URL}/students/`, getAuthHeader());
};

export const fetchStudentsByClass = (className: string) => {
  return axios.get(`${API_URL}/students/?class_name=${encodeURIComponent(className)}`, getAuthHeader());
};

// --------------------
// Student Bills
// --------------------
export const fetchBills = () => {
  return axios.get(`${API_URL}/bills/`, getAuthHeader());
};

export const createBill = (data: any) => {
  return axios.post(`${API_URL}/bills/create/`, data, getAuthHeader());
};

export const fetchBillDetail = (id: number) => {
  return axios.get(`${API_URL}/bills/${id}/`, getAuthHeader());
};

export const updateBill = (id: number, data: any) => {
  return axios.put(`${API_URL}/bills/${id}/`, data, getAuthHeader());
};

export const deleteBill = (id: number) => {
  return axios.delete(`${API_URL}/bills/${id}/`, getAuthHeader());
};

// --------------------
// Student Bill Logs
// --------------------
export const fetchBillLogs = (billId: number) => {
  return axios.get(`${API_URL}/bills/${billId}/logs/`, getAuthHeader());
};

// --------------------
// Student-Only APIs
// --------------------
export const fetchMyBills = () => {
  return axios.get(`${API_URL}/my-bills/`, getAuthHeader());
};

export const fetchMyCurrentClassBills = () => {
  return axios.get(`${API_URL}/my-bills/current-class/`, getAuthHeader());
};

export const fetchMyPreviousClassBills = () => {
  return axios.get(`${API_URL}/my-bills/previous-classes/`, getAuthHeader());
};

// --------------------
// Advanced Operations
// --------------------
export const recalculateStudentBalances = (studentId?: number) => {
  const data = studentId ? { student_id: studentId } : {};
  return axios.post(`${API_URL}/recalculate-balances/`, data, getAuthHeader());
};

export const fetchStudentBalanceSummary = (studentId: number) => {
  return axios.get(`${API_URL}/student-balance-summary/${studentId}/`, getAuthHeader());
};

export const bulkUpdatePayments = (updates: any[]) => {
  return axios.post(`${API_URL}/bulk-payment-update/`, { updates }, getAuthHeader());
};