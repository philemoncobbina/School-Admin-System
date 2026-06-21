/**
 * ReceiptRequestDetail.jsx
 * Admin/staff: detailed view of a single payment receipt request.
 * Features: full info display, inline status review, audit log timeline, delete.
 *
 * FIX: component now reads its own useParams() as a fallback when the
 * `requestId` prop is not supplied by the parent. This is the most common
 * cause of the "No request ID provided" error — the parent renders the
 * component without forwarding the route param as a prop.
 *
 * UPDATE: Now allows status changes even after acceptance (e.g., to revert
 * an accepted request back to pending or under_review).
 *
 * UPDATE 2: ReviewPanel now lets staff correct amount, payment_method,
 * payment_reference, and phone_number before (or independently of) a
 * status change. phone_number is also shown in Payment Details.
 *
 * UPDATE 3 (UX fixes):
 *  - Status select is always pre-filled with the current status so the
 *    payload never omits a status when the user only edits payment details.
 *  - "Correct Payment Details" panel is disabled/locked when the request is
 *    accepted AND the user has not yet chosen a different status — prevents
 *    accidental edits without an intentional status transition.
 *  - Back arrow navigates to /dashboard/receipt-request via useNavigate
 *    (falls back to the onBack prop when supplied by a parent).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchReceiptRequestById,
  reviewReceiptRequest,
  deleteReceiptRequest,
} from "../../services/receiptRequestAdminApi";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
  },
};

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  cheque: "Cheque",
  other: "Other",
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const ACTION_LABELS = {
  submitted: "Submitted",
  marked_under_review: "Marked Under Review",
  rejected: "Rejected",
  accepted: "Accepted",
  reset_to_pending: "Reset to Pending",
  status_changed: "Status Changed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (val) =>
  `GHS ${parseFloat(val || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
  })}`;

// ─── Custom Select ────────────────────────────────────────────────────────────

function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  dotConfig = STATUS_CONFIG,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={!selectedOption ? "text-slate-400" : "text-slate-700"}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {dotConfig[selectedOption.value] && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    dotConfig[selectedOption.value]?.dot || "bg-slate-400"
                  }`}
                />
              )}
              {selectedOption.label}
            </span>
          ) : (
            placeholder || "Select an option..."
          )}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50 flex items-center gap-2 ${
                value === option.value
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600"
              }`}
            >
              {dotConfig[option.value] && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    dotConfig[option.value]?.dot || "bg-slate-400"
                  }`}
                />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${cfg.color}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider sm:w-40 shrink-0 mt-0.5">
        {label}
      </span>
      <span
        className={`text-sm text-slate-700 ${
          mono ? "font-mono bg-slate-100 px-2 py-0.5 rounded text-xs" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function AuditTimeline({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        No audit log entries found.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
      <div className="space-y-0">
        {logs.map((log, idx) => {
          const isFirst = idx === 0;
          const dotColor =
            STATUS_CONFIG[log.new_status]?.dot || "bg-slate-300";

          return (
            <div key={log.id} className="relative pl-10 pb-6">
              <div
                className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${dotColor}`}
              />
              <div
                className={`rounded-xl border p-4 bg-white shadow-sm ${
                  isFirst ? "ring-1 ring-slate-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {ACTION_LABELS[log.action] || log.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      by {log.actor_first_name} {log.actor_last_name}
                      {" · "}
                      {log.actor_email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </p>
                    {log.old_status && log.new_status && (
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {STATUS_CONFIG[log.old_status]?.label ||
                            log.old_status}
                        </span>
                        <span className="text-slate-300 text-xs">→</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border ${
                            STATUS_CONFIG[log.new_status]?.color || ""
                          }`}
                        >
                          {STATUS_CONFIG[log.new_status]?.label ||
                            log.new_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {log.comment && (
                  <p className="mt-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 italic">
                    "{log.comment}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Review Panel ─────────────────────────────────────────────────────────────

function ReviewPanel({ request, onSuccess }) {
  // ── Status change state ───────────────────────────────────────────────────
  // Pre-fill with the current status so the payload always includes one.
  const [newStatus, setNewStatus] = useState(request.status);
  const [comment, setComment] = useState("");

  // ── Payment detail correction state ──────────────────────────────────────
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");

  // Track whether the detail section is expanded
  const [showDetailEdits, setShowDetailEdits] = useState(false);

  // ── Submission state ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Derived flags ─────────────────────────────────────────────────────────
  const requiresComment = ["under_review", "rejected"].includes(newStatus);
  const isAccepted = request.status === "accepted";
  const isRejected = request.status === "rejected";

  // When the request is accepted, payment details are locked unless the user
  // has selected a different (non-accepted) status first.
  const detailsLocked = isAccepted && newStatus === "accepted";

  // Reset all fields whenever the underlying request changes (e.g. after a
  // successful save the parent passes a fresh `request` object).
  useEffect(() => {
    setNewStatus(request.status); // always reset to the fresh current status
    setComment("");
    setEditAmount("");
    setEditPaymentMethod("");
    setEditPaymentReference("");
    setEditPhoneNumber("");
    setShowDetailEdits(false);
    setError("");
    setSuccess("");
  }, [request.id, request.updated_at, request.status]);

  // Collapse and clear detail edits if the user re-selects accepted while
  // the detail panel was open (i.e. they opened it, changed mind on status).
  useEffect(() => {
    if (detailsLocked && showDetailEdits) {
      setShowDetailEdits(false);
      setEditAmount("");
      setEditPaymentMethod("");
      setEditPaymentReference("");
      setEditPhoneNumber("");
    }
  }, [detailsLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Available status options ───────────────────────────────────────────────
  let availableStatuses = [];

  if (isAccepted) {
    availableStatuses = [
      { value: "accepted", label: "Accepted" }, // current — always present so select isn't blank
      { value: "pending", label: "↻ Revert to Pending" },
      { value: "under_review", label: "↻ Revert to Under Review" },
      { value: "rejected", label: "↻ Revert to Rejected" },
    ];
  } else if (isRejected) {
    availableStatuses = [
      { value: "rejected", label: "Rejected" }, // current — always present
      { value: "pending", label: "↻ Reopen as Pending" },
      { value: "under_review", label: "↻ Move to Under Review" },
      { value: "accepted", label: "✓ Accept & Generate Receipt" },
    ];
  } else {
    // pending / under_review — include current status so the select is never blank
    availableStatuses = [
      { value: "pending", label: "Pending" },
      { value: "under_review", label: "Under Review" },
      { value: "rejected", label: "Rejected" },
      { value: "accepted", label: "Accept & Generate Receipt" },
    ];
  }

  // ── Build the payload ──────────────────────────────────────────────────────
  // Always include the selected status (even if it matches the current one the
  // backend should be idempotent). Only send detail fields that changed.
  const buildPayload = () => {
    const payload = { status: newStatus };

    if (comment.trim()) payload.review_comment = comment.trim();

    if (showDetailEdits && !detailsLocked) {
      const trimmedAmount = editAmount.trim();
      const trimmedRef = editPaymentReference.trim();
      const trimmedPhone = editPhoneNumber.trim();

      if (trimmedAmount !== "") {
        const parsed = parseFloat(trimmedAmount);
        if (!isNaN(parsed)) payload.amount = parsed;
      }
      if (editPaymentMethod !== "") payload.payment_method = editPaymentMethod;
      if (trimmedRef !== "") payload.payment_reference = trimmedRef;
      // Allow explicitly clearing the phone number by sending an empty string.
      if (trimmedPhone !== "") payload.phone_number = trimmedPhone;
    }

    return payload;
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const statusChanged = newStatus !== request.status;
    const hasDetailChange =
      showDetailEdits &&
      !detailsLocked &&
      (editAmount.trim() !== "" ||
        editPaymentMethod !== "" ||
        editPaymentReference.trim() !== "" ||
        editPhoneNumber.trim() !== "");

    if (!statusChanged && !hasDetailChange) {
      setError(
        "Nothing to save. Select a different status or edit payment details."
      );
      return false;
    }
    if (statusChanged && requiresComment && !comment.trim()) {
      setError("A comment is required for this status change.");
      return false;
    }
    if (
      showDetailEdits &&
      editAmount.trim() !== "" &&
      (isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0)
    ) {
      setError("Amount must be a positive number.");
      return false;
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!validate()) return;

    setLoading(true);

    try {
      const result = await reviewReceiptRequest(
        Number(request.id),
        buildPayload()
      );

      const updatedRequest = result?.data ?? result;
      setSuccess(result.message || "Changes saved successfully.");
      onSuccess(updatedRequest);
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.errors?.review_comment?.[0] ||
        data?.errors?.amount?.[0] ||
        data?.errors?.payment_method?.[0] ||
        data?.errors?.payment_reference?.[0] ||
        data?.errors?.phone_number?.[0] ||
        data?.message ||
        err?.message ||
        "Failed to save changes. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const showRevertWarning =
    isAccepted && newStatus && newStatus !== "accepted";

  return (
    <div className="space-y-5">

      {/* ── Status change section ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {isAccepted ? "Amend Status" : "Change Status"}
          </label>
          <CustomSelect
            value={newStatus}
            onValueChange={(val) => {
              setNewStatus(val);
              setError("");
              setSuccess("");
            }}
            options={availableStatuses}
            placeholder="Select new status…"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Comment
            {requiresComment && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Textarea
            placeholder={
              requiresComment
                ? "Required — explain why you are making this change…"
                : "Optional internal note…"
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none min-h-[80px] bg-white"
          />
        </div>

        {/* Info box when accepting */}
        {newStatus === "accepted" && !isAccepted && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold mb-1">This will:</p>
            <ul className="list-disc list-inside space-y-0.5 text-emerald-600 text-xs">
              <li>Generate a payment receipt automatically</li>
              <li>
                Deduct{" "}
                {formatAmount(
                  editAmount.trim() !== "" ? editAmount : request.amount
                )}{" "}
                from the bill
              </li>
              <li>Notify the student via email &amp; SMS</li>
            </ul>
          </div>
        )}

        {/* Warning when reverting an accepted request */}
        {showRevertWarning && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            <p className="font-semibold mb-1">⚠️ Status Change Warning</p>
            <p className="text-xs text-amber-600">
              This request has already been accepted. Changing its status will
              {newStatus === "rejected"
                ? " mark it as rejected and void the previously generated receipt."
                : " revert it to a pending state and delete the previously generated receipt."}
            </p>
          </div>
        )}
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100" />

      {/* ── Payment detail corrections ────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Toggle button — disabled with tooltip hint when details are locked */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (detailsLocked) return; // guard — shouldn't be reachable but safe
              setShowDetailEdits((v) => !v);
              setError("");
            }}
            disabled={detailsLocked}
            className={`w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider transition-colors ${
              detailsLocked
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Correct Payment Details</span>
            {detailsLocked ? (
              /* Lock icon when section is unavailable */
              <svg
                className="w-4 h-4 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              <svg
                className={`w-4 h-4 transition-transform text-slate-400 ${
                  showDetailEdits ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>

          {/* Inline hint shown only when locked */}
          {detailsLocked && (
            <p className="mt-1.5 text-xs text-slate-400">
              Change the status above before editing payment details.
            </p>
          )}
        </div>

        {showDetailEdits && !detailsLocked && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Leave a field blank to keep its current value. Changes here are
              saved together with any status update above.
            </p>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  GHS
                </span>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={parseFloat(request.amount || 0).toFixed(2)}
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-10 bg-white text-sm"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Payment Method
              </label>
              <CustomSelect
                value={editPaymentMethod}
                onValueChange={setEditPaymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                placeholder={
                  PAYMENT_METHOD_LABELS[request.payment_method] ||
                  request.payment_method ||
                  "Select method…"
                }
                dotConfig={{}} // no status dots for payment method
              />
            </div>

            {/* Payment Reference */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Payment Reference
              </label>
              <Input
                type="text"
                placeholder={request.payment_reference || "Transaction ID…"}
                value={editPaymentReference}
                onChange={(e) => setEditPaymentReference(e.target.value)}
                className="bg-white text-sm font-mono"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder={request.phone_number || "e.g. +233 XX XXX XXXX"}
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                className="bg-white text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Feedback messages ─────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <Button
        className={`w-full font-medium transition-colors ${
          newStatus === "accepted"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : newStatus === "rejected"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-slate-900 hover:bg-slate-800 text-white"
        }`}
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing…
          </span>
        ) : isAccepted && newStatus === "accepted" ? (
          "Save Changes"
        ) : (
          "Confirm Change"
        )}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * `requestId` can be supplied two ways:
 *
 *   1. As a prop from the parent:
 *      <ReceiptRequestDetail requestId={someId} onBack={...} onDeleted={...} />
 *
 *   2. Automatically from the URL when the component is mounted on a route
 *      like /receipt-requests/:id — no prop needed in this case.
 *
 * The component always prefers the explicit prop; it falls back to useParams
 * only when the prop is absent.
 *
 * Back navigation goes to /dashboard/receipt-request by default. Supply an
 * `onBack` prop to override this behaviour (e.g. when the component is used
 * inside a modal or a custom layout that manages its own history stack).
 */
export default function ReceiptRequestDetail({
  requestId: requestIdProp,
  onBack,
  onDeleted,
}) {
  // ── Resolve the ID ─────────────────────────────────────────────────────────
  const params = useParams();
  const navigate = useNavigate();
  const rawId = requestIdProp ?? params.id ?? params.requestId;
  const resolvedId =
    rawId !== undefined && rawId !== null && rawId !== ""
      ? Number(rawId)
      : null;

  // ── Back navigation ────────────────────────────────────────────────────────
  // If a parent provides onBack, call that. Otherwise push the canonical route.
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/dashboard/receipt-request");
    }
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (resolvedId === null || Number.isNaN(resolvedId)) {
      setError(
        "No request ID found. Make sure this component is rendered inside a " +
          "route with an :id param, or that the requestId prop is passed."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchReceiptRequestById(resolvedId);

      if (!result || typeof result !== "object") {
        throw new Error("Unexpected response from server.");
      }

      setData(result);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError("Receipt request not found.");
      } else if (status === 403) {
        setError("You don't have permission to view this request.");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load request."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const handleReviewSuccess = (updated) => {
    if (updated && typeof updated === "object" && updated.id) {
      setData(updated);
    } else {
      load();
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteReceiptRequest(resolvedId);
      setDeleteOpen(false);
      if (onDeleted) {
        onDeleted();
      } else {
        navigate("/dashboard/receipt-request");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete. Please try again.";
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg
            className="animate-spin h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Loading request…</span>
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-red-600 max-w-sm">
            {error || "Request not found."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleBack}>
              ← Back
            </Button>
            <Button size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: main ───────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Top nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              All Requests
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-slate-500 hover:text-slate-700"
                onClick={load}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                onClick={() => {
                  setDeleteError("");
                  setDeleteOpen(true);
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </Button>
            </div>
          </div>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 shrink-0">
                  {data.student_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {data.student_name}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Submitted {formatDateTime(data.submitted_at)}
                    {data.reviewed_by && (
                      <> · Reviewed by {data.reviewed_by}</>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {data.bill_number}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatAmount(data.amount)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      {PAYMENT_METHOD_LABELS[data.payment_method] ||
                        data.payment_method}
                    </span>
                    {data.phone_number && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">
                          {data.phone_number}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <StatusBadge status={data.status} />
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex items-center gap-1 mb-5 bg-white rounded-xl border border-slate-200 p-1 w-fit shadow-sm">
            {[
              { key: "details", label: "Details" },
              {
                key: "log",
                label: `Audit Log (${data.logs?.length ?? 0})`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "details" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: payment info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Payment Details card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Payment Details
                    </h2>
                  </div>
                  <div className="px-6 py-2">
                    <InfoRow label="Student" value={data.student_name} />
                    <InfoRow
                      label="Bill Number"
                      value={data.bill_number}
                      mono
                    />
                    <InfoRow
                      label="Amount"
                      value={formatAmount(data.amount)}
                    />
                    <InfoRow
                      label="Payment Method"
                      value={
                        PAYMENT_METHOD_LABELS[data.payment_method] ||
                        data.payment_method
                      }
                    />
                    <InfoRow
                      label="Reference"
                      value={data.payment_reference}
                      mono
                    />
                    <InfoRow
                      label="Phone Number"
                      value={data.phone_number || "—"}
                    />
                    <InfoRow
                      label="Submitted At"
                      value={formatDateTime(data.submitted_at)}
                    />
                    <InfoRow
                      label="Last Updated"
                      value={formatDateTime(data.updated_at)}
                    />
                  </div>
                </div>

                {/* Review info */}
                {(data.reviewed_by || data.review_comment) && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Review Information
                      </h2>
                    </div>
                    <div className="px-6 py-2">
                      <InfoRow label="Reviewed By" value={data.reviewed_by} />
                      <InfoRow
                        label="Reviewed At"
                        value={formatDateTime(data.reviewed_at)}
                      />
                      {data.review_comment && (
                        <div className="py-3 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                            Comment
                          </span>
                          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 italic">
                            "{data.review_comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generated receipt */}
                {data.generated_receipt && (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-emerald-200">
                      <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Generated Receipt
                      </h2>
                    </div>
                    <div className="px-6 py-2">
                      <InfoRow
                        label="Receipt No."
                        value={`#${data.generated_receipt.receipt_number}`}
                        mono
                      />
                      <InfoRow
                        label="Amount"
                        value={formatAmount(data.generated_receipt.amount_paid)}
                      />
                      <InfoRow
                        label="Payment Date"
                        value={formatDateTime(
                          data.generated_receipt.payment_date
                        )}
                      />
                      {data.generated_receipt.notes && (
                        <InfoRow
                          label="Notes"
                          value={data.generated_receipt.notes}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Proof of payment */}
                {data.proof_of_payment_url && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                        Proof of Payment
                      </h2>
                    </div>
                    <div className="px-6 py-4">
                      <a
                        href={data.proof_of_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-all font-medium"
                      >
                        <svg
                          className="w-5 h-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        View Uploaded Proof
                        <svg
                          className="w-3.5 h-3.5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Review panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Review Request
                    </h2>
                  </div>
                  <div className="px-5 py-4">
                    <ReviewPanel
                      request={data}
                      onSuccess={handleReviewSuccess}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Audit log tab */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Audit Log
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete history of every action taken on this request
                </p>
              </div>
              <div className="px-6 py-6">
                <AuditTimeline logs={data.logs} />
              </div>
            </div>
          )}
        </div>

        {/* Delete dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the payment request from{" "}
                <span className="font-semibold">{data.student_name}</span> for{" "}
                <span className="font-mono text-sm">{data.bill_number}</span>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mx-1">
                {deleteError}
              </p>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Delete Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}