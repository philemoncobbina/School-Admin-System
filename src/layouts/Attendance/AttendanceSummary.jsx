import { useEffect, useState } from "react";
import { AttendanceApi } from "../../Services/attendanceApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Search,
  CalendarDays,
  UserRound,
  School,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export default function AttendanceSummary() {
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [summary, setSummary] = useState(null);

  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsByClass(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudent("");
    }
  }, [selectedClass]);

  const loadInitialData = async () => {
    await Promise.all([loadTerms(), loadClasses()]);
  };

  const loadTerms = async () => {
    try {
      setLoadingTerms(true);
      setError("");

      const data = await AttendanceApi.getTerms();
      const termList = Array.isArray(data) ? data : data?.results || [];

      setTerms(termList);

      const currentTerm = termList.find((term) => term.is_current);
      if (currentTerm) {
        setSelectedTerm(String(currentTerm.id));
      } else if (termList.length > 0) {
        setSelectedTerm(String(termList[0].id));
      }
    } catch (err) {
      setError(getApiError(err, "Failed to load academic terms."));
    } finally {
      setLoadingTerms(false);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      setError("");

      const data = await AttendanceApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiError(err, "Failed to load classes."));
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudentsByClass = async (className) => {
    if (!className) return;

    try {
      setLoadingStudents(true);
      setError("");
      setStudents([]);
      setSelectedStudent("");
      setSummary(null);

      const data = await AttendanceApi.getStudentsByClass({
        class_name: className,
      });

      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiError(err, "Failed to load students in selected class."));
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedTerm) {
      setError("Please select an academic term.");
      return;
    }

    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }

    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }

    try {
      setLoadingSummary(true);
      setError("");
      setSummary(null);

      const data = await AttendanceApi.getSummary({
        term: Number(selectedTerm),
        class_name: selectedClass,
        student: Number(selectedStudent),
      });

      setSummary(data);
    } catch (err) {
      setError(getApiError(err, "Failed to load attendance summary."));
    } finally {
      setLoadingSummary(false);
    }
  };

  const summaryTotals = summary?.summary;
  const student = summary?.student;
  const term = summary?.term;
  const attendanceHistory = summary?.attendance_history || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Attendance Summary
        </h1>
        <p className="text-sm text-slate-500">
          Select term, class and student to view total attendance plus date by
          date attendance history.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Search Attendance Summary</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Academic Term</Label>
            <Select
              value={selectedTerm}
              onValueChange={(value) => {
                setSelectedTerm(value);
                setSummary(null);
              }}
              disabled={loadingTerms}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingTerms ? "Loading terms..." : "Select academic term"
                  }
                />
              </SelectTrigger>

              <SelectContent className="bg-white">
                {terms.map((termItem) => (
                  <SelectItem key={termItem.id} value={String(termItem.id)}>
                    {termItem.term_display} - {termItem.academic_year}
                    {termItem.is_current ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                setSummary(null);
              }}
              disabled={loadingClasses}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingClasses ? "Loading classes..." : "Select class"}
                />
              </SelectTrigger>

              <SelectContent className="bg-white">
                {classes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Student</Label>
            <Select
              value={selectedStudent}
              onValueChange={(value) => {
                setSelectedStudent(value);
                setSummary(null);
              }}
              disabled={!selectedClass || loadingStudents}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingStudents
                      ? "Loading students..."
                      : selectedClass
                      ? "Select student"
                      : "Select class first"
                  }
                />
              </SelectTrigger>

              <SelectContent className="bg-white">
                {students.map((studentItem) => (
                  <SelectItem key={studentItem.id} value={String(studentItem.id)}>
                    {studentItem.full_name || `${studentItem.first_name} ${studentItem.last_name}`}
                    {studentItem.index_number ? ` - ${studentItem.index_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={loadSummary}
              disabled={loadingSummary}
            >
              {loadingSummary ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Load Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <InfoCard
              icon={<UserRound className="h-5 w-5 text-blue-600" />}
              label="Student"
              value={student?.full_name || "N/A"}
              subValue={student?.index_number || "No index number"}
            />

            <InfoCard
              icon={<School className="h-5 w-5 text-purple-600" />}
              label="Class"
              value={student?.class_name || "N/A"}
              subValue={`${term?.term_display || ""} ${term?.academic_year || ""}`}
            />

            <InfoCard
              icon={<CalendarDays className="h-5 w-5 text-slate-600" />}
              label="School Days"
              value={summaryTotals?.total_school_days ?? 0}
              subValue={`Marked: ${summaryTotals?.total_marked ?? 0}`}
            />

            <InfoCard
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              label="Unmarked"
              value={summaryTotals?.days_unmarked ?? 0}
              subValue="School days not marked"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <StatCard
              label="Present"
              value={summaryTotals?.days_present ?? 0}
              color="green"
            />

            <StatCard
              label="Absent"
              value={summaryTotals?.days_absent ?? 0}
              color="red"
            />

            <StatCard
              label="Official Attendance"
              value={`${summaryTotals?.attendance_percentage ?? 0}%`}
              color={getPercentageColor(summaryTotals?.attendance_percentage)}
            />

            <StatCard
              label="Marked Attendance"
              value={`${summaryTotals?.marked_attendance_percentage ?? 0}%`}
              color={getPercentageColor(summaryTotals?.marked_attendance_percentage)}
            />
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Attendance Percentage</CardTitle>

              <Badge
                className={getPercentageBadgeClass(
                  summaryTotals?.attendance_percentage
                )}
              >
                {summaryTotals?.attendance_percentage ?? 0}%
              </Badge>
            </CardHeader>

            <CardContent>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={getPercentageBarClass(
                    summaryTotals?.attendance_percentage
                  )}
                  style={{
                    width: `${Math.min(
                      Number(summaryTotals?.attendance_percentage) || 0,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Present for {summaryTotals?.days_present ?? 0} out of{" "}
                {summaryTotals?.total_school_days ?? 0} official school days.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Official attendance uses total school days. Marked attendance uses
                only days where attendance has been taken.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Attendance History</CardTitle>
            </CardHeader>

            <CardContent>
              {!attendanceHistory.length ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
                  No attendance records have been taken for this student in the
                  selected term.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <div className="hidden grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Reason</div>
                    <div className="col-span-2">Finalized</div>
                    <div className="col-span-3">Marked By</div>
                  </div>

                  <div className="divide-y">
                    {attendanceHistory.map((record) => (
                      <div
                        key={record.record_id}
                        className="grid gap-2 px-4 py-4 text-sm md:grid-cols-12 md:items-center"
                      >
                        <div className="font-medium text-slate-900 md:col-span-2">
                          {formatDate(record.date)}
                        </div>

                        <div className="md:col-span-2">
                          <StatusBadge status={record.status} />
                        </div>

                        <div className="text-slate-700 md:col-span-3">
                          {record.absence_reason || "N/A"}
                        </div>

                        <div className="md:col-span-2">
                          <Badge
                            variant="secondary"
                            className={
                              record.is_finalized
                              
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {record.is_finalized ? "Finalized" : "Not finalized"}
                          </Badge>
                        </div>

                        <div className="text-slate-500 md:col-span-3">
                          <p>{record.marked_by_name || "N/A"}</p>
                          <p className="text-xs">
                            Updated: {formatDateTime(record.updated_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, subValue }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex gap-3 p-4">
        <div className="mt-1">{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {value ?? "N/A"}
          </p>
          {subValue ? <p className="text-xs text-slate-400">{subValue}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, color }) {
  const colorClass =
    color === "green"
      ? "text-green-700"
      : color === "red"
      ? "text-red-700"
      : color === "yellow"
      ? "text-yellow-700"
      : "text-slate-900";

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${colorClass}`}>
          {value ?? "N/A"}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  if (status === "present") {
    return (
      <Badge className="bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Present
      </Badge>
    );
  }

  if (status === "absent") {
    return (
      <Badge className="bg-red-600">
        <XCircle className="mr-1 h-3 w-3" />
        Absent
      </Badge>
    );
  }

  return <Badge variant="secondary">Unknown</Badge>;
}

function getPercentageColor(value) {
  const percentage = Number(value) || 0;

  if (percentage >= 80) return "green";
  if (percentage >= 60) return "yellow";

  return "red";
}

function getPercentageBadgeClass(value) {
  const percentage = Number(value) || 0;

  if (percentage >= 80) return "bg-green-600";
  if (percentage >= 60) return "bg-yellow-600";

  return "bg-red-600";
}

function getPercentageBarClass(value) {
  const percentage = Number(value) || 0;

  if (percentage >= 80) return "h-full rounded-full bg-green-600";
  if (percentage >= 60) return "h-full rounded-full bg-yellow-500";

  return "h-full rounded-full bg-red-600";
}

function formatDate(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApiError(error, fallback) {
  if (error?.message === "No access token found") {
    return "You are not logged in. Please log in again.";
  }

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