import { useEffect, useMemo, useState } from "react";
import { AttendanceApi } from "../../Services/attendanceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  CheckCircle2,
  RotateCcw,
  Search,
  Users,
  UserCheck,
  UserX,
  Percent,
  AlertCircle,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react";

const CLASS_OPTIONS = [
  "Nursery 1",
  "Nursery 2",
  "KG 1",
  "KG 2",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "JHS 1",
  "JHS 2",
  "JHS 3",
];

const AVATAR_TINTS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function initialsFor(fullName = "") {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function tintFor(id) {
  const n = typeof id === "number" ? id : String(id).length;
  return AVATAR_TINTS[n % AVATAR_TINTS.length];
}

// Normalized snapshot of the bits of the roster that actually matter for
// "does this differ from what's saved on the server". Keeping this narrow
// (instead of JSON.stringify-ing the whole roster) means field ordering or
// incidental student_detail differences never produce false positives.
function snapshotRoster(roster) {
  return JSON.stringify(
    roster.map((item) => ({
      id: item.student.id,
      status: item.status,
      reason: item.status === "absent" ? item.absence_reason || "" : "",
    }))
  );
}

export default function AttendanceManager() {
  const today = new Date().toISOString().slice(0, 10);

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [className, setClassName] = useState("");
  const [date, setDate] = useState(today);

  const [roster, setRoster] = useState([]);
  const [registerId, setRegisterId] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);

  // Snapshot of the roster as it exists on the server. Diffing against this
  // is how we know there are unsaved edits sitting in the UI.
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const selectedTermObject = useMemo(() => {
    return terms.find((term) => String(term.id) === String(selectedTerm));
  }, [terms, selectedTerm]);

  const isDirty = useMemo(() => {
    if (!roster.length) return false;
    return snapshotRoster(roster) !== savedSnapshot;
  }, [roster, savedSnapshot]);

  useEffect(() => {
    loadTerms();
  }, []);

  // Warn on tab close / refresh if there's unsaved work.
  useEffect(() => {
    const handler = (e) => {
      if (isDirty && !isFinalized) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, isFinalized]);

  const loadTerms = async () => {
    try {
      setLoadingTerms(true);
      setError("");

      const data = await AttendanceApi.getTerms();
      setTerms(data);

      const current = data.find((term) => term.is_current);
      if (current) {
        setSelectedTerm(String(current.id));
      }
    } catch (err) {
      setError(getApiError(err, "Failed to load terms."));
    } finally {
      setLoadingTerms(false);
    }
  };

  const loadRoster = async () => {
    if (!className || !selectedTerm || !date) {
      setError("Please select class, term and date.");
      return;
    }

    if (isDirty && !isFinalized && roster.length) {
      const proceed = window.confirm(
        "You have unsaved attendance changes for the current roster. Loading a new roster will discard them. Continue?"
      );
      if (!proceed) return;
    }

    try {
      setLoadingRoster(true);
      setError("");
      setMessage("");

      const data = await AttendanceApi.getRoster({
        class_name: className,
        term: Number(selectedTerm),
        date,
      });

      setRegisterId(data.register);
      setIsFinalized(data.is_finalized);

      const nextRoster = data.roster.map((item) => ({
        student: item.student,
        status: item.status || "present",
        absence_reason: item.absence_reason || "",
      }));

      setRoster(nextRoster);
      setSavedSnapshot(snapshotRoster(nextRoster));
      setSearch("");
      setStatusFilter("all");
    } catch (err) {
      setRoster([]);
      setRegisterId(null);
      setIsFinalized(false);
      setSavedSnapshot("");
      setError(getApiError(err, "Failed to load roster."));
    } finally {
      setLoadingRoster(false);
    }
  };

  const markAllPresent = () => {
    setRoster((prev) =>
      prev.map((item) => ({
        ...item,
        status: "present",
        absence_reason: "",
      }))
    );
  };

  const updateStatus = (studentId, status) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student.id === studentId
          ? {
              ...item,
              status,
              absence_reason: status === "present" ? "" : item.absence_reason,
            }
          : item
      )
    );
  };

  const updateReason = (studentId, reason) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.student.id === studentId
          ? {
              ...item,
              absence_reason: reason,
            }
          : item
      )
    );
  };

  // Returns true on success, false on failure, so callers (like the
  // save-then-finalize flow) can chain off it without duplicating logic.
  const saveAttendance = async () => {
    if (!roster.length) {
      setError("Load a roster first.");
      return false;
    }

    const missingReason = roster.find(
      (item) =>
        item.status === "absent" && !String(item.absence_reason || "").trim()
    );

    if (missingReason) {
      setError(`Enter absence reason for ${missingReason.student.full_name}.`);
      return false;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        class_name: className,
        term: Number(selectedTerm),
        date,
        records: roster.map((item) => ({
          student: item.student.id,
          status: item.status,
          absence_reason:
            item.status === "absent" ? item.absence_reason : null,
        })),
      };

      const data = await AttendanceApi.markAttendance(payload);

      setRegisterId(data.id);
      setIsFinalized(data.is_finalized);
      setSavedSnapshot(snapshotRoster(roster));
      setMessage("Attendance saved successfully.");
      return true;
    } catch (err) {
      setError(getApiError(err, "Failed to save attendance."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const finalizeRegister = async () => {
    if (!registerId) {
      setError("Save attendance first before finalizing.");
      return false;
    }

    try {
      setFinalizing(true);
      setError("");
      setMessage("");

      const data = await AttendanceApi.finalizeRegister(registerId);
      setIsFinalized(data.is_finalized);
      setMessage("Register finalized successfully.");
      return true;
    } catch (err) {
      setError(getApiError(err, "Failed to finalize register."));
      return false;
    } finally {
      setFinalizing(false);
    }
  };

  // Gatekeeper for the "Finalize Register" button. If there are edits sitting
  // in the UI that never made it to the server, we stop and ask instead of
  // silently finalizing stale data.
  const handleFinalizeClick = () => {
    if (!registerId) {
      setError("Save attendance first before finalizing.");
      return;
    }
    if (isDirty) {
      setShowUnsavedModal(true);
      return;
    }
    finalizeRegister();
  };

  const handleSaveAndFinalize = async () => {
    setShowUnsavedModal(false);
    const saved = await saveAttendance();
    if (saved) {
      await finalizeRegister();
    }
  };

  const handleDiscardAndFinalize = async () => {
    setShowUnsavedModal(false);
    // Roll the visible roster back to what's actually on the server, then
    // finalize that. Only reachable when a saved register already exists.
    try {
      setLoadingRoster(true);
      const data = await AttendanceApi.getRoster({
        class_name: className,
        term: Number(selectedTerm),
        date,
      });
      const revertedRoster = data.roster.map((item) => ({
        student: item.student,
        status: item.status || "present",
        absence_reason: item.absence_reason || "",
      }));
      setRoster(revertedRoster);
      setSavedSnapshot(snapshotRoster(revertedRoster));
    } catch (err) {
      setError(getApiError(err, "Failed to discard changes."));
      setLoadingRoster(false);
      return;
    } finally {
      setLoadingRoster(false);
    }
    await finalizeRegister();
  };

  const reopenRegister = async () => {
    if (!registerId) {
      setError("No register found.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await AttendanceApi.reopenRegister(registerId);
      setIsFinalized(data.is_finalized);
      setMessage("Register reopened successfully.");
    } catch (err) {
      setError(getApiError(err, "Failed to reopen register."));
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((item) => item.status === "present").length;
  const absentCount = roster.filter((item) => item.status === "absent").length;
  const attendanceRate = roster.length
    ? Math.round((presentCount / roster.length) * 100)
    : 0;

  const filteredRoster = roster.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.student.full_name?.toLowerCase().includes(q) ||
      item.student.index_number?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const busy = saving || finalizing || loadingRoster;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mark Attendance
        </h1>
        <p className="text-sm text-slate-500">
          Select a class, term and date, then load the register to mark students present or absent.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Register Filters
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Class
            </Label>
            <Select value={className} onValueChange={setClassName}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {CLASS_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Term
            </Label>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="bg-white">
                <SelectValue
                  placeholder={loadingTerms ? "Loading terms..." : "Select term"}
                />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {terms.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.term_display} - {term.academic_year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Date
            </Label>
            <Input
              type="date"
              className="bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={loadRoster}
              disabled={loadingRoster}
            >
              {loadingRoster && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Load Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat row */}
      {roster.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={roster.length}
            icon={Users}
            accent="border-l-slate-400"
            iconClass="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Present"
            value={presentCount}
            icon={UserCheck}
            accent="border-l-emerald-500"
            iconClass="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            label="Absent"
            value={absentCount}
            icon={UserX}
            accent="border-l-rose-500"
            iconClass="bg-rose-100 text-rose-600"
          />
          <StatCard
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={Percent}
            accent="border-l-indigo-500"
            iconClass="bg-indigo-100 text-indigo-600"
          />
        </div>
      )}

      {selectedTermObject && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-700">
            {selectedTermObject.term_display} &middot; {selectedTermObject.academic_year}
          </span>
          <span className="text-slate-300">|</span>
          <span>{selectedTermObject.total_school_days} school days</span>
          <span className="text-slate-300">|</span>
          {isFinalized ? (
            <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
              <Lock className="h-3.5 w-3.5" /> Register finalized
            </span>
          ) : (
            <span className="font-medium text-amber-600">Register open</span>
          )}
        </div>
      )}

      {/* Roster */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Students
            </CardTitle>
            {isFinalized ? (
              <Badge className="bg-indigo-600 hover:bg-indigo-600">Finalized</Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                Open
              </Badge>
            )}
            {!isFinalized && isDirty && roster.length > 0 && (
              <Badge className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50">
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search name or index no."
                className="w-56 bg-white pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!roster.length}
              />
            </div>

            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              {[
                { key: "all", label: "All" },
                { key: "present", label: "Present" },
                { key: "absent", label: "Absent" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={!roster.length}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    statusFilter === opt.key
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={!roster.length || isFinalized}
              onClick={markAllPresent}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {!roster.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No students loaded yet. Choose a class, term and date above, then load the register.
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No students match your search or filter.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="hidden grid-cols-12 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <div className="col-span-5">Student</div>
                <div className="col-span-2">Index No.</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Absence Reason</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRoster.map((item) => {
                  const isAbsent = item.status === "absent";
                  return (
                    <div
                      key={item.student.id}
                      className={`grid gap-3 px-4 py-3.5 transition-colors md:grid-cols-12 md:items-center ${
                        isAbsent ? "bg-rose-50/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 md:col-span-5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tintFor(
                            item.student.id
                          )}`}
                        >
                          {initialsFor(item.student.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.student.full_name}
                          </p>
                          <p className="text-xs text-slate-500 md:hidden">
                            {item.student.index_number || "No index number"}
                          </p>
                        </div>
                      </div>

                      <div className="hidden text-sm text-slate-600 md:col-span-2 md:block">
                        {item.student.index_number || "N/A"}
                      </div>

                      <div className="md:col-span-2">
                        <Select
                          value={item.status}
                          disabled={isFinalized}
                          onValueChange={(value) =>
                            updateStatus(item.student.id, value)
                          }
                        >
                          <SelectTrigger
                            className={`font-medium ${
                              isAbsent
                                ? "border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-300"
                                : "border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-300"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="present">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Present
                              </span>
                            </SelectItem>
                            <SelectItem value="absent">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                Absent
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-3">
                        <Input
                          placeholder={isAbsent ? "Required" : "Required if absent"}
                          disabled={item.status === "present" || isFinalized}
                          value={item.absence_reason || ""}
                          onChange={(e) =>
                            updateReason(item.student.id, e.target.value)
                          }
                          className={
                            isAbsent && !item.absence_reason?.trim()
                              ? "border-rose-300 bg-white focus-visible:ring-rose-300"
                              : "bg-white"
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={!roster.length || saving || isFinalized}
              onClick={saveAttendance}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Attendance
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={!registerId || finalizing || isFinalized}
              onClick={handleFinalizeClick}
            >
              {finalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalize Register
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!registerId || saving || !isFinalized}
              onClick={reopenRegister}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reopen
            </Button>

            {roster.length > 0 && (
              <span className="ml-auto text-xs text-slate-400">
                Showing {filteredRoster.length} of {roster.length} students
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {showUnsavedModal && (
        <UnsavedChangesModal
          busy={busy}
          canDiscard={Boolean(registerId)}
          onSaveAndFinalize={handleSaveAndFinalize}
          onDiscardAndFinalize={handleDiscardAndFinalize}
          onCancel={() => setShowUnsavedModal(false)}
        />
      )}
    </div>
  );
}

function UnsavedChangesModal({
  busy,
  canDiscard,
  onSaveAndFinalize,
  onDiscardAndFinalize,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="unsaved-changes-title"
                className="text-base font-semibold text-slate-900"
              >
                You have unsaved changes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                This register has edits that haven't been saved yet.
                Finalizing now would lock in the last saved version, not
                what's currently on screen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-5">
          <Button
            type="button"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={onSaveAndFinalize}
            disabled={busy}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes &amp; Finalize
          </Button>

          {canDiscard && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={onDiscardAndFinalize}
              disabled={busy}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Discard Changes &amp; Finalize
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            className="w-full text-slate-600 hover:bg-slate-100"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, iconClass }) {
  return (
    <Card className={`rounded-2xl border-slate-200 border-l-4 shadow-sm ${accent}`}>
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getApiError(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors?.length) return data.non_field_errors[0];

  const firstField =
    data && typeof data === "object" ? Object.keys(data)[0] : null;

  if (firstField && Array.isArray(data[firstField])) {
    return `${firstField}: ${data[firstField][0]}`;
  }

  if (firstField && typeof data[firstField] === "string") {
    return `${firstField}: ${data[firstField]}`;
  }

  return fallback;
}