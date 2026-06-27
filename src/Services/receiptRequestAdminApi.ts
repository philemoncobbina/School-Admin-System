/**
 * receiptRequestAdminApi.ts
 * Axios service for admin/staff: listing, viewing, reviewing, deleting payment receipt requests.
 * Used by: ReceiptRequestsTable.jsx  and  ReceiptRequestDetail.jsx
 */

import axios, { AxiosResponse } from "axios";

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.cobbina.uk/api";

// ─── Auth headers ─────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    console.warn("receiptRequestAdminApi: no access_token found in localStorage");
  }
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

// ─── 401 helper ───────────────────────────────────────────────────────────────

const handle401 = (error: any): never => {
  if (error?.response?.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
  throw error;
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch all receipt requests.
 * @param statusFilter  Optional status to filter by.
 */
export const fetchAllReceiptRequests = async (
  statusFilter?: RequestStatus | ""
): Promise<PaymentReceiptRequest[]> => {
  try {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;

    const response: AxiosResponse<PaymentReceiptRequest[] | ListResponse> =
      await axios.get(`${API_BASE_URL}/receipt-requests/`, {
        ...getAuthHeaders(),
        params,
      });

    const data = response.data;
    if (Array.isArray(data)) return data;
    if ("results" in data && Array.isArray(data.results)) return data.results;
    return [];
  } catch (error: any) {
    return handle401(error);
  }
};

/**
 * Fetch a single receipt request by ID.
 */
export const fetchReceiptRequestById = async (
  id: number
): Promise<PaymentReceiptRequest> => {
  try {
    const response: AxiosResponse<PaymentReceiptRequest> = await axios.get(
      `${API_BASE_URL}/receipt-requests/${id}/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    return handle401(error);
  }
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
  try {
    const response: AxiosResponse<ReviewResponse> = await axios.patch(
      `${API_BASE_URL}/receipt-requests/${id}/review/`,
      payload,
      getAuthHeaders()
    );
    return response.data;
  } catch (error: any) {
    return handle401(error);
  }
};

/**
 * Fetch audit logs for a specific receipt request.
 */
export const fetchReceiptRequestLogs = async (
  requestId: number
): Promise<PaymentReceiptRequestLog[]> => {
  try {
    const response: AxiosResponse<PaymentReceiptRequestLog[]> =
      await axios.get(
        `${API_BASE_URL}/receipt-requests/${requestId}/logs/`,
        getAuthHeaders()
      );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    return handle401(error);
  }
};

/**
 * Delete a receipt request.
 * Note: only pending/rejected requests should be deletable (enforce in UI).
 */
export const deleteReceiptRequest = async (id: number): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/receipt-requests/${id}/`,
      getAuthHeaders()
    );
  } catch (error: any) {
    return handle401(error);
  }
};

/**
 * Bulk delete receipt requests.
 */
export const bulkDeleteReceiptRequests = async (
  ids: number[]
): Promise<{ deleted: number[]; failed: number[] }> => {
  const results = await Promise.allSettled(
    ids.map((id) =>
      axios.delete(`${API_BASE_URL}/receipt-requests/${id}/`, getAuthHeaders())
    )
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

export const handleUnauthorized = (error: any): boolean => {
  if (error?.response?.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return true;
  }
  return false;
};

export default {
  fetchAllReceiptRequests,
  fetchReceiptRequestById,
  reviewReceiptRequest,
  fetchReceiptRequestLogs,
  deleteReceiptRequest,
  bulkDeleteReceiptRequests,
};