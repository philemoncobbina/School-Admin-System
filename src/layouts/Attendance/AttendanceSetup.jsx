import { useEffect, useMemo, useRef, useState } from "react";
import { AttendanceApi } from "../../Services/attendanceApi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  Plus,
  Trash2,
  Calendar,
  CalendarDays,
  CalendarOff,
  CalendarCheck2,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
} from "lucide-react";

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

export default function AttendanceSetup() {
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [holidays, setHolidays] = useState([]);

  const [termForm, setTermForm] = useState({
    academic_year: "2026-2027",
    term: "first",
    start_date: "",
    end_date: "",
    exclude_weekends: true,
    is_current: false,
  });

  const [holidayForm, setHolidayForm] = useState({
    date: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [savingTerm, setSavingTerm] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Term list filters
  const [termSearch, setTermSearch] = useState("");
  const [termFilter, setTermFilter] = useState("all"); // all | current

  const holidaysCardRef = useRef(null);

  const currentTerm = useMemo(
    () => terms.find((term) => term.is_current),
    [terms]
  );

  const selectedTermObject = useMemo(
    () => terms.find((term) => String(term.id) === String(selectedTerm)),
    [terms, selectedTerm]
  );

  const filteredTerms = useMemo(() => {
    const q = termSearch.trim().toLowerCase();

    return terms.filter((term) => {
      const matchesFilter = termFilter === "all" || Boolean(term.is_current);
      const matchesSearch =
        !q ||
        term.academic_year?.toLowerCase().includes(q) ||
        term.term_display?.toLowerCase().includes(q) ||
        term.term?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [terms, termSearch, termFilter]);

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      loadHolidays(selectedTerm);
    } else {
      setHolidays([]);
    }
  }, [selectedTerm]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await AttendanceApi.getTerms();
      const termsArray = Array.isArray(data) ? data : [];

      setTerms(termsArray);

      const current = termsArray.find((item) => item.is_current);

      if (current) {
        setSelectedTerm(String(current.id));
      } else if (termsArray.length > 0) {
        setSelectedTerm(String(termsArray[0].id));
      } else {
        setSelectedTerm("");
      }
    } catch (err) {
      setError(getApiError(err, "Failed to load terms."));
      setTerms([]);
      setSelectedTerm("");
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async (termId) => {
    try {
      const data = await AttendanceApi.getHolidays({
        term: Number(termId),
      });

      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiError(err, "Failed to load holidays."));
      setHolidays([]);
    }
  };

  const viewHolidaysForTerm = (termId) => {
    setSelectedTerm(String(termId));
    holidaysCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const createTerm = async (event) => {
    event.preventDefault();

    if (
      !termForm.academic_year ||
      !termForm.term ||
      !termForm.start_date ||
      !termForm.end_date
    ) {
      setError("Please fill all required term fields.");
      return;
    }

    if (termForm.start_date > termForm.end_date) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setSavingTerm(true);
      setError("");
      setMessage("");

      const created = await AttendanceApi.createTerm(termForm);

      setMessage("Academic term created successfully.");

      setTermForm({
        academic_year: "2026-2027",
        term: "first",
        start_date: "",
        end_date: "",
        exclude_weekends: true,
        is_current: false,
      });

      await loadTerms();

      if (created?.id) {
        setSelectedTerm(String(created.id));
      }
    } catch (err) {
      setError(getApiError(err, "Failed to create academic term."));
    } finally {
      setSavingTerm(false);
    }
  };

  const createHoliday = async (event) => {
    event.preventDefault();

    if (!selectedTerm || !holidayForm.date) {
      setError("Please select a term and enter holiday date.");
      return;
    }

    try {
      setSavingHoliday(true);
      setError("");
      setMessage("");

      await AttendanceApi.createHoliday({
        term: Number(selectedTerm),
        date: holidayForm.date,
        reason: holidayForm.reason,
      });

      setHolidayForm({
        date: "",
        reason: "",
      });

      setMessage("Holiday added successfully.");

      await loadHolidays(selectedTerm);
      await loadTerms();
    } catch (err) {
      setError(getApiError(err, "Failed to add holiday."));
    } finally {
      setSavingHoliday(false);
    }
  };

  const deleteHoliday = async (holidayId) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await AttendanceApi.deleteHoliday(holidayId);

      setMessage("Holiday deleted successfully.");

      if (selectedTerm) {
        await loadHolidays(selectedTerm);
      }

      await loadTerms();
    } catch (err) {
      setError(getApiError(err, "Failed to delete holiday."));
    }
  };

  const deleteTerm = async (termId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this term? This will also delete all associated holidays and attendance records."
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await AttendanceApi.deleteTerm(termId);

      setMessage("Academic term deleted successfully.");
      setSelectedTerm("");

      await loadTerms();
    } catch (err) {
      setError(getApiError(err, "Failed to delete term."));
    }
  };

  const renderAlert = (type, alertMessage) => {
    const isError = type === "error";

    return (
      <div
        className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
          isError
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {isError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        )}

        <span>{alertMessage}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Attendance Setup
        </h1>

        <p className="text-sm text-slate-500">
          Create academic terms, set the active term, and manage holidays.
        </p>
      </div>

      {error && renderAlert("error", error)}
      {message && renderAlert("success", message)}

      {/* Summary row */}
      {terms.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Academic Terms"
            value={terms.length}
            icon={CalendarDays}
            accent="border-l-slate-400"
            iconClass="bg-slate-100 text-slate-600"
          />
          <SummaryCard
            label="Current Term"
            value={
              currentTerm
                ? `${currentTerm.term_display || currentTerm.term}`
                : "Not set"
            }
            icon={CalendarCheck2}
            accent="border-l-indigo-500"
            iconClass="bg-indigo-100 text-indigo-600"
          />
          <SummaryCard
            label="Holidays This Term"
            value={selectedTerm ? holidays.length : "—"}
            icon={CalendarOff}
            accent="border-l-amber-500"
            iconClass="bg-amber-100 text-amber-600"
          />
          <SummaryCard
            label="School Days"
            value={selectedTermObject?.total_school_days ?? "—"}
            icon={Calendar}
            accent="border-l-emerald-500"
            iconClass="bg-emerald-100 text-emerald-600"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Create Academic Term
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={createTerm} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="academic_year"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Academic Year
                </Label>

                <Input
                  id="academic_year"
                  placeholder="2026-2027"
                  className="bg-white"
                  value={termForm.academic_year}
                  onChange={(e) =>
                    setTermForm({
                      ...termForm,
                      academic_year: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="term"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Term
                </Label>

                <Select
                  value={termForm.term}
                  onValueChange={(value) =>
                    setTermForm({
                      ...termForm,
                      term: value,
                    })
                  }
                >
                  <SelectTrigger id="term" className="bg-white">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    <SelectItem value="first">First Term</SelectItem>
                    <SelectItem value="second">Second Term</SelectItem>
                    <SelectItem value="third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="start_date"
                    className="text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    Start Date
                  </Label>

                  <Input
                    id="start_date"
                    type="date"
                    className="bg-white"
                    value={termForm.start_date}
                    onChange={(e) =>
                      setTermForm({
                        ...termForm,
                        start_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="end_date"
                    className="text-xs font-medium uppercase tracking-wide text-slate-500"
                  >
                    End Date
                  </Label>

                  <Input
                    id="end_date"
                    type="date"
                    className="bg-white"
                    value={termForm.end_date}
                    onChange={(e) =>
                      setTermForm({
                        ...termForm,
                        end_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exclude_weekends"
                    checked={termForm.exclude_weekends}
                    onCheckedChange={(checked) =>
                      setTermForm({
                        ...termForm,
                        exclude_weekends: Boolean(checked),
                      })
                    }
                  />

                  <Label htmlFor="exclude_weekends" className="text-sm font-normal text-slate-700">
                    Exclude weekends from school days
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_current"
                    checked={termForm.is_current}
                    onCheckedChange={(checked) =>
                      setTermForm({
                        ...termForm,
                        is_current: Boolean(checked),
                      })
                    }
                  />

                  <Label htmlFor="is_current" className="text-sm font-normal text-slate-700">
                    Set as current term
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingTerm}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 md:w-auto"
              >
                {savingTerm && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                <Plus className="mr-2 text-white h-4 w-4" />
                Create Term
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Add Holiday
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={createHoliday} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="term_select"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Select Term
                </Label>

                <Select
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                  disabled={loading}
                >
                  <SelectTrigger id="term_select" className="bg-white">
                    <SelectValue
                      placeholder={loading ? "Loading terms..." : "Select term"}
                    />
                  </SelectTrigger>

                  <SelectContent className="bg-white">
                    {Array.isArray(terms) &&
                      terms.map((term) => (
                        <SelectItem key={term.id} value={String(term.id)}>
                          {term.term_display || term.term} -{" "}
                          {term.academic_year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="holiday_date"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Holiday Date
                </Label>

                <Input
                  id="holiday_date"
                  type="date"
                  className="bg-white"
                  value={holidayForm.date}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="holiday_reason"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Reason
                </Label>

                <Input
                  id="holiday_reason"
                  placeholder="Founder's Day, Mid-term break, etc."
                  className="bg-white"
                  value={holidayForm.reason}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      reason: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={savingHoliday || !selectedTerm}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 md:w-auto"
              >
                {savingHoliday && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                <Plus className="mr-2 text-white h-4 w-4" />
                Add Holiday
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Academic Terms
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search year or term..."
                className="w-56 bg-white pl-8"
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
                disabled={!terms.length}
              />
            </div>

            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              {[
                { key: "all", label: "All" },
                { key: "current", label: "Current" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={!terms.length}
                  onClick={() => setTermFilter(opt.key)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    termFilter === opt.key
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !Array.isArray(terms) || !terms.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              No academic terms created yet.
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              No terms match your search or filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTerms.map((term) => {
                const isViewing = String(term.id) === String(selectedTerm);

                return (
                  <div
                    key={term.id}
                    className={`flex flex-col gap-3 rounded-xl border border-l-4 p-4 transition-colors md:flex-row md:items-center md:justify-between ${
                      term.is_current
                        ? "border-l-indigo-500 bg-indigo-50/40 border-slate-200"
                        : "border-l-slate-200 border-slate-200 hover:bg-slate-50"
                    } ${isViewing ? "ring-2 ring-indigo-300" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          term.is_current
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {term.term_display || term.term} -{" "}
                            {term.academic_year}
                          </h3>

                          {term.is_current && (
                            <Badge className="bg-indigo-600 hover:bg-indigo-600">
                              Current
                            </Badge>
                          )}

                          {isViewing && (
                            <Badge
                              variant="outline"
                              className="border-indigo-300 text-indigo-600"
                            >
                              Viewing holidays
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(term.start_date).toLocaleDateString()} to{" "}
                          {new Date(term.end_date).toLocaleDateString()}
                        </p>

                        <p className="text-sm text-slate-500">
                          {term.total_school_days ?? 0} school days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:self-center">
                      <Button
                        type="button"
                        variant={isViewing ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => viewHolidaysForTerm(term.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Holidays
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTerm(term.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        ref={holidaysCardRef}
        className="scroll-mt-6 rounded-2xl border-slate-200 shadow-sm"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Holidays for Selected Term
          </CardTitle>
          {selectedTermObject && (
            <span className="text-sm text-slate-500">
              {selectedTermObject.term_display || selectedTermObject.term} -{" "}
              {selectedTermObject.academic_year}
            </span>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {!selectedTerm ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              Select a term above to view its holidays.
            </div>
          ) : !Array.isArray(holidays) || !holidays.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              <CalendarOff className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              No holidays added for this term.
            </div>
          ) : (
            <div className="space-y-3">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <CalendarOff className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(holiday.date).toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>

                      <p className="text-sm text-slate-500">
                        {holiday.reason || "Holiday"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHoliday(holiday.id)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, accent, iconClass }) {
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
          <p className="mt-0.5 truncate text-lg font-bold text-slate-900" title={String(value)}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}