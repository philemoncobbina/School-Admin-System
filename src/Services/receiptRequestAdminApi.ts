/**
 * receiptRequestAdminApi.ts
 * Axios service for admin/staff: listing, viewing, reviewing, deleting payment receipt requests.
 * Used by: ReceiptRequestsTable.jsx  and  ReceiptRequestDetail.jsx
 */

import axios, { AxiosResponse } from "axios";
import { API_URL } from "./http"; // adjust the path if http.ts lives elsewhere

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequestStatus =
  | "pending"
  | "under_review"
  | "rejected"
  | "accepted";

export interface PaymentReceiptRequestLog {
  id: number;
  action: string;
  old_status: string;
  new_status: string;
  comment: string;
  actor_first_name: string;
  actor_last_name: string;
  actor_email: string;
  timestamp: string;
}

export interface GeneratedReceipt {
  id: number;
  receipt_number: string;
  amount_paid: string;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}

export interface PaymentReceiptRequest {
  id: number;
  student_bill: number;
  bill_number: string;
  student_name: string;
  submitted_by: string;
  amount: string;
  payment_method: string;
  payment_reference: string;
  proof_of_payment: string | null;
  proof_of_payment_url: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  generated_receipt: GeneratedReceipt | null;
  submitted_at: string;
  updated_at: string;
  logs: PaymentReceiptRequestLog[];
}

export interface ReviewPayload {
  status: RequestStatus;
  review_comment?: string;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  status: RequestStatus;
  data: PaymentReceiptRequest;
}

export interface ListResponse {
  results?: PaymentReceiptRequest[];
  count?: number;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

// Built from the shared API_URL (http://localhost:8000/api/), which always ends with a slash.
// The interceptors only attach cookies and the CSRF token to URLs that start with API_URL,
// so this service must not use a different base.
const BASE = `${API_URL}receipt-requests/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers,
// and the interceptors already refresh the session or redirect to /login on a 401.

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch all receipt requests.
 * @param statusFilter  Optional status to filter by.
 */
export const fetchAllReceiptRequests = async (
  statusFilter?: RequestStatus | ""
): Promise<PaymentReceiptRequest[]> => {
  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;

  const response: AxiosResponse<PaymentReceiptRequest[] | ListResponse> =
    await axios.get(BASE, { params });

  const data = response.data;
  if (Array.isArray(data)) return data;
  if ("results" in data && Array.isArray(data.results)) return data.results;
  return [];
};

/**
 * Fetch a single receipt request by ID.
 */
export const fetchReceiptRequestById = async (
  id: number
): Promise<PaymentReceiptRequest> => {
  const response: AxiosResponse<PaymentReceiptRequest> = await axios.get(
    `${BASE}${id}/`
  );
  return response.data;
};

/**
 * Review (change status of) a receipt request.
 * For under_review / rejected: review_comment is required.
 * For accepted: backend auto-generates a PaymentReceipt.
 */
export const reviewReceiptRequest = async (
  id: number,
  payload: ReviewPayload
): Promise<ReviewResponse> => {
  const response: AxiosResponse<ReviewResponse> = await axios.patch(
    `${BASE}${id}/review/`,
    payload
  );
  return response.data;
};

/**
 * Fetch audit logs for a specific receipt request.
 */
export const fetchReceiptRequestLogs = async (
  requestId: number
): Promise<PaymentReceiptRequestLog[]> => {
  const response: AxiosResponse<PaymentReceiptRequestLog[]> = await axios.get(
    `${BASE}${requestId}/logs/`
  );
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Delete a receipt request.
 * Note: only pending/rejected requests should be deletable (enforce in UI).
 */
export const deleteReceiptRequest = async (id: number): Promise<void> => {
  await axios.delete(`${BASE}${id}/`);
};

/**
 * Bulk delete receipt requests.
 */
export const bulkDeleteReceiptRequests = async (
  ids: number[]
): Promise<{ deleted: number[]; failed: number[] }> => {
  const results = await Promise.allSettled(
    ids.map((id) => axios.delete(`${BASE}${id}/`))
  );

  const deleted: number[] = [];
  const failed: number[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      deleted.push(ids[index]);
    } else {
      failed.push(ids[index]);
    }
  });

  return { deleted, failed };
};

/**
 * Kept so existing `if (handleUnauthorized(err)) return;` calls still work.
 * It only reports whether the error was a 401. By the time an error reaches here,
 * the interceptors have already tried a refresh and sent the user to /login.
 */
export const handleUnauthorized = (error: any): boolean =>
  error?.response?.status === 401;

export default {
  fetchAllReceiptRequests,
  fetchReceiptRequestById,
  reviewReceiptRequest,
  fetchReceiptRequestLogs,
  deleteReceiptRequest,
  bulkDeleteReceiptRequests,
};