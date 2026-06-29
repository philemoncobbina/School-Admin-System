// src/services/billingService.ts
import axios from "axios";

const API_URL = " https://api.cobbina.uk/api";

// --------------------
// AUTH HELPERS
// --------------------
const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    throw new Error("No access token found");
  }
  return { Authorization: `Bearer ${accessToken}` };
};

const getAuthHeader = () => ({
  headers: getAuthHeaders(),
});

// --------------------
// BILLING TEMPLATES
// --------------------
export const fetchTemplates = () =>
  axios.get(`${API_URL}/templates/`, getAuthHeader());

export const createTemplate = (data: any) =>
  axios.post(`${API_URL}/templates/`, data, getAuthHeader());

export const fetchTemplateDetail = (id: number) =>
  axios.get(`${API_URL}/templates/${id}/`, getAuthHeader());

export const updateTemplate = (id: number, data: any) =>
  axios.put(`${API_URL}/templates/${id}/`, data, getAuthHeader());

export const deleteTemplate = (id: number) =>
  axios.delete(`${API_URL}/templates/${id}/`, getAuthHeader());

// --------------------
// BILLING ITEMS
// --------------------
export const fetchItems = () =>
  axios.get(`${API_URL}/items/`, getAuthHeader());

export const createItem = (data: any) =>
  axios.post(`${API_URL}/items/`, data, getAuthHeader());

export const fetchItemDetail = (id: number) =>
  axios.get(`${API_URL}/items/${id}/`, getAuthHeader());

export const updateItem = (id: number, data: any) =>
  axios.put(`${API_URL}/items/${id}/`, data, getAuthHeader());

export const deleteItem = (id: number) =>
  axios.delete(`${API_URL}/items/${id}/`, getAuthHeader());

export const fetchItemLogs = (billingItemId: number) =>
  axios.get(`${API_URL}/items/${billingItemId}/logs/`, getAuthHeader());

// --------------------
// PAYMENT RECEIPTS
// --------------------
export const fetchPaymentReceipts = () =>
  axios.get(`${API_URL}/payment-receipts/`, getAuthHeader());

export const fetchBillPaymentReceipts = (billId: number) =>
  axios.get(`${API_URL}/bills/${billId}/payment-receipts/`, getAuthHeader());

export const createPaymentReceipt = (data: any) =>
  axios.post(`${API_URL}/payment-receipts/`, data, getAuthHeader());

export const createBillPaymentReceipt = (billId: number, data: any) =>
  axios.post(`${API_URL}/bills/${billId}/payment-receipts/`, data, getAuthHeader());

export const fetchPaymentReceiptDetail = (id: number) =>
  axios.get(`${API_URL}/payment-receipts/${id}/`, getAuthHeader());

export const updatePaymentReceipt = (id: number, data: any) =>
  axios.put(`${API_URL}/payment-receipts/${id}/`, data, getAuthHeader());

export const deletePaymentReceipt = (id: number) =>
  axios.delete(`${API_URL}/payment-receipts/${id}/`, getAuthHeader());

// --------------------
// STUDENTS
// --------------------
export const fetchStudents = () =>
  axios.get(`${API_URL}/students/`, getAuthHeader());

export const fetchStudentsByClass = (className: string) =>
  axios.get(
    `${API_URL}/students/?class_name=${encodeURIComponent(className)}`,
    getAuthHeader()
  );

// --------------------
// STUDENT BILLS
// --------------------
export const fetchBills = () =>
  axios.get(`${API_URL}/bills/`, getAuthHeader());

export const createBill = (data: any) =>
  axios.post(`${API_URL}/bills/create/`, data, getAuthHeader());

export const fetchBillDetail = (id: number) =>
  axios.get(`${API_URL}/bills/${id}/`, getAuthHeader());

export const updateBill = (id: number, data: any) =>
  axios.put(`${API_URL}/bills/${id}/`, data, getAuthHeader());

export const deleteBill = (id: number) =>
  axios.delete(`${API_URL}/bills/${id}/`, getAuthHeader());

// --------------------
// ✅ NEW: PUBLISH (INDIVIDUAL)
// --------------------
export const publishBill = (billId: number) =>
  axios.post(`${API_URL}/bills/${billId}/publish/`, {}, getAuthHeader());

// --------------------
// ✅ NEW: BULK PUBLISH (CLASS + TERM + YEAR)
// --------------------
export interface BulkPublishPayload {
  class_name: string;
  term: string;
  academic_year: string;
}

export const bulkPublishBills = (data: BulkPublishPayload) =>
  axios.post(`${API_URL}/bills/bulk-publish/`, data, getAuthHeader());

// --------------------
// ✅ OPTIONAL: VALIDATE BEFORE PUBLISH (SAME ENDPOINT)
// --------------------
// This just calls the same API and lets backend return missing_students error
export const validateBulkPublish = (data: BulkPublishPayload) =>
  axios.post(`${API_URL}/bills/bulk-publish/`, data, getAuthHeader());

// --------------------
// STUDENT BILL LOGS
// --------------------
export const fetchBillLogs = (billId: number) =>
  axios.get(`${API_URL}/bills/${billId}/logs/`, getAuthHeader());

// --------------------
// ✅ EXTRA: BALANCE SUMMARY (HANDY FOR DASHBOARD)
// --------------------
export const fetchStudentBalanceSummary = (studentId: number) =>
  axios.get(`${API_URL}/students/${studentId}/balance-summary/`, getAuthHeader());
