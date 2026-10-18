// src/services/billingService.ts
import axios from "axios";
import { API_URL } from "./http"; // adjust the path if http.ts lives elsewhere

// Same base as before (http://localhost:8000/api), built from the shared API_URL.
// Always ends with a slash, so endpoints below have no leading slash.
//
// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.

// --------------------
// BILLING TEMPLATES
// --------------------
export const fetchTemplates = () =>
  axios.get(`${API_URL}templates/`);

export const createTemplate = (data: any) =>
  axios.post(`${API_URL}templates/`, data);

export const fetchTemplateDetail = (id: number) =>
  axios.get(`${API_URL}templates/${id}/`);

export const updateTemplate = (id: number, data: any) =>
  axios.put(`${API_URL}templates/${id}/`, data);

export const deleteTemplate = (id: number) =>
  axios.delete(`${API_URL}templates/${id}/`);

// --------------------
// BILLING ITEMS
// --------------------
export const fetchItems = () =>
  axios.get(`${API_URL}items/`);

export const createItem = (data: any) =>
  axios.post(`${API_URL}items/`, data);

export const fetchItemDetail = (id: number) =>
  axios.get(`${API_URL}items/${id}/`);

export const updateItem = (id: number, data: any) =>
  axios.put(`${API_URL}items/${id}/`, data);

export const deleteItem = (id: number) =>
  axios.delete(`${API_URL}items/${id}/`);

export const fetchItemLogs = (billingItemId: number) =>
  axios.get(`${API_URL}items/${billingItemId}/logs/`);

// --------------------
// PAYMENT RECEIPTS
// --------------------
export const fetchPaymentReceipts = () =>
  axios.get(`${API_URL}payment-receipts/`);

export const fetchBillPaymentReceipts = (billId: number) =>
  axios.get(`${API_URL}bills/${billId}/payment-receipts/`);

export const createPaymentReceipt = (data: any) =>
  axios.post(`${API_URL}payment-receipts/`, data);

export const createBillPaymentReceipt = (billId: number, data: any) =>
  axios.post(`${API_URL}bills/${billId}/payment-receipts/`, data);

export const fetchPaymentReceiptDetail = (id: number) =>
  axios.get(`${API_URL}payment-receipts/${id}/`);

export const updatePaymentReceipt = (id: number, data: any) =>
  axios.put(`${API_URL}payment-receipts/${id}/`, data);

export const deletePaymentReceipt = (id: number) =>
  axios.delete(`${API_URL}payment-receipts/${id}/`);

// --------------------
// STUDENTS
// --------------------
export const fetchStudents = () =>
  axios.get(`${API_URL}students/`);

export const fetchStudentsByClass = (className: string) =>
  axios.get(`${API_URL}students/`, {
    params: { class_name: className },
  });

// --------------------
// STUDENT BILLS
// --------------------
export const fetchBills = () =>
  axios.get(`${API_URL}bills/`);

export const createBill = (data: any) =>
  axios.post(`${API_URL}bills/create/`, data);

export const fetchBillDetail = (id: number) =>
  axios.get(`${API_URL}bills/${id}/`);

export const updateBill = (id: number, data: any) =>
  axios.put(`${API_URL}bills/${id}/`, data);

export const deleteBill = (id: number) =>
  axios.delete(`${API_URL}bills/${id}/`);

// --------------------
// PUBLISH (INDIVIDUAL)
// --------------------
export const publishBill = (billId: number) =>
  axios.post(`${API_URL}bills/${billId}/publish/`, {});

// --------------------
// BULK PUBLISH (CLASS + TERM + YEAR)
// --------------------
export interface BulkPublishPayload {
  class_name: string;
  term: string;
  academic_year: string;
}

export const bulkPublishBills = (data: BulkPublishPayload) =>
  axios.post(`${API_URL}bills/bulk-publish/`, data);

// --------------------
// VALIDATE BEFORE PUBLISH (SAME ENDPOINT)
// --------------------
// This just calls the same API and lets backend return missing_students error
export const validateBulkPublish = (data: BulkPublishPayload) =>
  axios.post(`${API_URL}bills/bulk-publish/`, data);

// --------------------
// STUDENT BILL LOGS
// --------------------
export const fetchBillLogs = (billId: number) =>
  axios.get(`${API_URL}bills/${billId}/logs/`);

// --------------------
// BALANCE SUMMARY (HANDY FOR DASHBOARD)
// --------------------
export const fetchStudentBalanceSummary = (studentId: number) =>
  axios.get(`${API_URL}students/${studentId}/balance-summary/`);