import axios from "axios";

import {
  attendanceCache,
  CACHE_TTL,
  cacheKeys,
  cachePrefixes,
} from "./attendanceCache";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.cobbina.uk/api";

const API_BASE = String(RAW_API_BASE).replace(/\/+$/, "");

const attendanceApi = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let activeAccessToken: string | null = null;

const getAuthHeaders = (): { Authorization: string } => {
  const accessToken = localStorage.getItem("access_token");

  if (!accessToken) {
    attendanceCache.clear();
    activeAccessToken = null;
    throw new Error("No access token found.");
  }

  if (
    activeAccessToken !== null &&
    activeAccessToken !== accessToken
  ) {
    attendanceCache.clear();
  }

  activeAccessToken = accessToken;

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const clearAttendanceSessionCache = (): void => {
  attendanceCache.clear();
  activeAccessToken = null;
};

attendanceApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAttendanceSessionCache();
      localStorage.removeItem("access_token");
    }

    return Promise.reject(error);
  }
);

// ======================================================
// Types
// ======================================================

export type AttendanceStatus = "present" | "absent";

export type AcademicTermName =
  | "first"
  | "second"
  | "third";

export interface Holiday {
  id: number;
  term: number;
  date: string;
  reason: string;
  created_at: string;
}

export interface AcademicTerm {
  id: number;
  academic_year: string;
  term: AcademicTermName;
  term_display: string;
  start_date: string;
  end_date: string;
  exclude_weekends: boolean;
  is_current: boolean;
  total_school_days: number;
  holidays: Holiday[];
  created_at: string;
  updated_at: string;
}

export interface StudentMini {
  id: number;
  index_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  class_name: string;
}

export interface AttendanceRecord {
  id: number;
  register: number;
  student: number;
  student_detail: StudentMini;
  status: AttendanceStatus;
  status_display: string;
  absence_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: number;
  register: number;
  record: number | null;
  student: number | null;
  student_name: string | null;
  user: number | null;
  user_email: string;
  action_type: string;
  action_type_display: string;
  changed_fields: string;
  timestamp: string;
}

export interface ClassAttendanceRegister {
  id: number;
  class_name: string;
  class_name_display: string;
  term: number;
  date: string;
  marked_by: number | null;
  marked_by_name: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  present_count: number;
  absent_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassAttendanceRegisterDetail
  extends ClassAttendanceRegister {
  records: AttendanceRecord[];
  logs: AttendanceLog[];
}

export interface RosterItem {
  student: StudentMini;
  status: AttendanceStatus | null;
  absence_reason: string | null;
}

export interface RosterResponse {
  class_name: string;
  term: number;
  date: string;
  register: number | null;
  is_finalized: boolean;
  roster: RosterItem[];
}

export interface MarkAttendancePayload {
  class_name: string;
  term: number;
  date: string;
  records: Array<{
    student: number;
    status: AttendanceStatus;
    absence_reason?: string | null;
  }>;
}

export interface ClassChoice {
  value: string;
  label: string;
}

export interface AttendanceHistoryItem {
  record_id: number;
  register_id: number;
  date: string;
  class_name: string;
  status: AttendanceStatus;
  status_display: string;
  absence_reason: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  marked_by: number | null;
  marked_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentAttendanceSummaryResponse {
  student: {
    id: number;
    index_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    class_name: string;
  };

  term: {
    id: number;
    academic_year: string;
    term: AcademicTermName;
    term_display: string;
    start_date: string;
    end_date: string;
    total_school_days: number;
  };

  summary: {
    total_school_days: number;
    total_marked: number;
    days_present: number;
    days_absent: number;
    days_unmarked: number;
    attendance_percentage: number;
    marked_attendance_percentage: number;
  };

  attendance_history: AttendanceHistoryItem[];
}

export interface CalendarDay {
  date: string;
  is_school_day: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface TermCalendarResponse {
  term: number;
  academic_year: string;
  term_name: AcademicTermName;
  term_display: string;
  total_school_days: number;
  days: CalendarDay[];
}

export interface FinalizeRegisterResponse {
  detail: string;
  notification_queued: boolean;
  register: ClassAttendanceRegisterDetail;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RegisterFilters {
  class_name?: string;
  term?: number;
  date?: string;
  is_finalized?: boolean;
}

export interface AttendanceRecordFilters {
  student?: number;
  class_name?: string;
  term?: number;
  status?: AttendanceStatus;
}

export interface AttendanceLogFilters {
  register?: number;
  record?: number;
  student?: number;
  action_type?: string;
}

export interface GetTermsParams {
  is_current?: boolean;
  academic_year?: string;
  term?: AcademicTermName | string;
}

export interface GetSummaryParams {
  term: number;
  class_name?: string;
  student?: number;
}

export interface CreateAcademicTermPayload {
  academic_year: string;
  term: AcademicTermName;
  start_date: string;
  end_date: string;
  exclude_weekends?: boolean;
  is_current?: boolean;
}

export type UpdateAcademicTermPayload =
  Partial<CreateAcademicTermPayload>;

export interface CreateHolidayPayload {
  term: number;
  date: string;
  reason?: string;
}

export interface UpdateHolidayPayload {
  term?: number;
  date?: string;
  reason?: string;
}

// ======================================================
// Helpers
// ======================================================

function normalizeList<T>(
  data: T[] | PaginatedResponse<T>
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function clearAllSummaryCaches(): void {
  attendanceCache.clearPrefix(
    cachePrefixes.summaries
  );

  attendanceCache.clearPrefix(
    cachePrefixes.selfSummaries
  );
}

function invalidateTermDependentCaches(
  termId: number
): void {
  attendanceCache.delete(
    cacheKeys.termCalendar(termId)
  );

  attendanceCache.clearPrefix(
    cachePrefixes.rosters
  );

  clearAllSummaryCaches();
}

function invalidateRegisterCaches(
  register: ClassAttendanceRegisterDetail
): void {
  attendanceCache.delete(
    cacheKeys.roster(
      register.class_name,
      register.term,
      register.date
    )
  );

  for (const record of register.records) {
    attendanceCache.delete(
      cacheKeys.summary(
        record.student,
        register.term
      )
    );
  }

  attendanceCache.clearPrefix(
    cachePrefixes.selfSummaries
  );
}

// ======================================================
// API endpoints
// ======================================================

export const AttendanceApi = {
  // ====================================================
  // Terms
  // ====================================================

  getTerms: async (
    params?: GetTermsParams
  ): Promise<AcademicTerm[]> => {
    const response = await attendanceApi.get<
      AcademicTerm[] | PaginatedResponse<AcademicTerm>
    >("/terms/", {
      params,
      headers: getAuthHeaders(),
    });

    return normalizeList(response.data);
  },

  getTerm: async (
    id: number
  ): Promise<AcademicTerm> => {
    const response =
      await attendanceApi.get<AcademicTerm>(
        `/terms/${id}/`,
        {
          headers: getAuthHeaders(),
        }
      );

    return response.data;
  },

  createTerm: async (
    payload: CreateAcademicTermPayload
  ): Promise<AcademicTerm> => {
    const response =
      await attendanceApi.post<AcademicTerm>(
        "/terms/",
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    attendanceCache.clearPrefix(
      cachePrefixes.termCalendars
    );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();

    return response.data;
  },

  updateTerm: async (
    id: number,
    payload: UpdateAcademicTermPayload
  ): Promise<AcademicTerm> => {
    const response =
      await attendanceApi.patch<AcademicTerm>(
        `/terms/${id}/`,
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    attendanceCache.clearPrefix(
      cachePrefixes.termCalendars
    );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();

    return response.data;
  },

  deleteTerm: async (
    id: number
  ): Promise<void> => {
    await attendanceApi.delete(
      `/terms/${id}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    invalidateTermDependentCaches(id);
  },

  getTermCalendar: async (
    termId: number
  ): Promise<TermCalendarResponse> => {
    const key = cacheKeys.termCalendar(termId);

    return attendanceCache.getOrLoad(
      key,
      async () => {
        const response =
          await attendanceApi.get<TermCalendarResponse>(
            `/terms/${termId}/calendar/`,
            {
              headers: getAuthHeaders(),
            }
          );

        return response.data;
      },
      CACHE_TTL.MEDIUM
    );
  },

  // ====================================================
  // Holidays
  // ====================================================

  getHolidays: async (
    params?: { term?: number }
  ): Promise<Holiday[]> => {
    const response = await attendanceApi.get<
      Holiday[] | PaginatedResponse<Holiday>
    >("/holidays/", {
      params,
      headers: getAuthHeaders(),
    });

    return normalizeList(response.data);
  },

  getHoliday: async (
    id: number
  ): Promise<Holiday> => {
    const response =
      await attendanceApi.get<Holiday>(
        `/holidays/${id}/`,
        {
          headers: getAuthHeaders(),
        }
      );

    return response.data;
  },

  createHoliday: async (
    payload: CreateHolidayPayload
  ): Promise<Holiday> => {
    const response =
      await attendanceApi.post<Holiday>(
        "/holidays/",
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    invalidateTermDependentCaches(
      response.data.term
    );

    return response.data;
  },

  updateHoliday: async (
    id: number,
    payload: UpdateHolidayPayload
  ): Promise<Holiday> => {
    const existingHoliday =
      await AttendanceApi.getHoliday(id);

    const response =
      await attendanceApi.patch<Holiday>(
        `/holidays/${id}/`,
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    invalidateTermDependentCaches(
      existingHoliday.term
    );

    if (
      response.data.term !== existingHoliday.term
    ) {
      invalidateTermDependentCaches(
        response.data.term
      );
    }

    return response.data;
  },

  deleteHoliday: async (
    id: number
  ): Promise<void> => {
    const holiday =
      await AttendanceApi.getHoliday(id);

    await attendanceApi.delete(
      `/holidays/${id}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    invalidateTermDependentCaches(
      holiday.term
    );
  },

  // ====================================================
  // Classes and students
  // ====================================================

  getClasses: async (): Promise<
    ClassChoice[]
  > => {
    const key = cacheKeys.classes();

    return attendanceCache.getOrLoad(
      key,
      async () => {
        const response =
          await attendanceApi.get<ClassChoice[]>(
            "/classes/",
            {
              headers: getAuthHeaders(),
            }
          );

        return response.data;
      },
      CACHE_TTL.LONG
    );
  },

  getStudentsByClass: async (
    params: { class_name: string }
  ): Promise<StudentMini[]> => {
    const key = cacheKeys.studentsByClass(
      params.class_name
    );

    return attendanceCache.getOrLoad(
      key,
      async () => {
        const response =
          await attendanceApi.get<StudentMini[]>(
            "/students-by-class/",
            {
              params,
              headers: getAuthHeaders(),
            }
          );

        return response.data;
      },
      CACHE_TTL.SHORT
    );
  },

  invalidateStudentsByClass: (
    className?: string
  ): void => {
    if (className) {
      attendanceCache.delete(
        cacheKeys.studentsByClass(className)
      );
    } else {
      attendanceCache.clearPrefix(
        cachePrefixes.studentsByClass
      );
    }

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );
  },

  // ====================================================
  // Registers
  // ====================================================

  getRegisters: async (
    filters?: RegisterFilters
  ): Promise<ClassAttendanceRegister[]> => {
    const response = await attendanceApi.get<
      | ClassAttendanceRegister[]
      | PaginatedResponse<ClassAttendanceRegister>
    >("/registers/", {
      params: filters,
      headers: getAuthHeaders(),
    });

    return normalizeList(response.data);
  },

  getRegister: async (
    id: number
  ): Promise<ClassAttendanceRegisterDetail> => {
    const response =
      await attendanceApi.get<ClassAttendanceRegisterDetail>(
        `/registers/${id}/`,
        {
          headers: getAuthHeaders(),
        }
      );

    return response.data;
  },

  getRoster: async (
    params: {
      class_name: string;
      term: number;
      date: string;
    }
  ): Promise<RosterResponse> => {
    const key = cacheKeys.roster(
      params.class_name,
      params.term,
      params.date
    );

    return attendanceCache.getOrLoad(
      key,
      async () => {
        const response =
          await attendanceApi.get<RosterResponse>(
            "/registers/roster/",
            {
              params,
              headers: getAuthHeaders(),
            }
          );

        return response.data;
      },
      CACHE_TTL.SHORT
    );
  },

  markAttendance: async (
    payload: MarkAttendancePayload
  ): Promise<ClassAttendanceRegisterDetail> => {
    const response =
      await attendanceApi.post<ClassAttendanceRegisterDetail>(
        "/registers/mark/",
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    attendanceCache.delete(
      cacheKeys.roster(
        payload.class_name,
        payload.term,
        payload.date
      )
    );

    for (const entry of payload.records) {
      attendanceCache.delete(
        cacheKeys.summary(
          entry.student,
          payload.term
        )
      );
    }

    attendanceCache.clearPrefix(
      cachePrefixes.selfSummaries
    );

    return response.data;
  },

  finalizeRegister: async (
    registerId: number
  ): Promise<ClassAttendanceRegisterDetail> => {
    const response =
      await attendanceApi.post<FinalizeRegisterResponse>(
        `/registers/${registerId}/finalize/`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

    const register = response.data.register;

    invalidateRegisterCaches(register);

    return register;
  },

  finalizeRegisterWithMetadata: async (
    registerId: number
  ): Promise<FinalizeRegisterResponse> => {
    const response =
      await attendanceApi.post<FinalizeRegisterResponse>(
        `/registers/${registerId}/finalize/`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

    invalidateRegisterCaches(
      response.data.register
    );

    return response.data;
  },

  reopenRegister: async (
    registerId: number
  ): Promise<ClassAttendanceRegisterDetail> => {
    const response =
      await attendanceApi.post<ClassAttendanceRegisterDetail>(
        `/registers/${registerId}/reopen/`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

    invalidateRegisterCaches(response.data);

    return response.data;
  },

  deleteRegister: async (
    registerId: number
  ): Promise<void> => {
    await attendanceApi.delete(
      `/registers/${registerId}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();
  },

  // ====================================================
  // Attendance records
  // ====================================================

  getRecords: async (
    filters?: AttendanceRecordFilters
  ): Promise<AttendanceRecord[]> => {
    const response = await attendanceApi.get<
      AttendanceRecord[] |
      PaginatedResponse<AttendanceRecord>
    >("/records/", {
      params: filters,
      headers: getAuthHeaders(),
    });

    return normalizeList(response.data);
  },

  createAttendanceRecord: async (
    payload: {
      register: number;
      student: number;
      status: AttendanceStatus;
      absence_reason?: string | null;
    }
  ): Promise<AttendanceRecord> => {
    const response =
      await attendanceApi.post<AttendanceRecord>(
        "/records/",
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();

    return response.data;
  },

  updateAttendanceRecord: async (
    recordId: number,
    payload: {
      status: AttendanceStatus;
      absence_reason?: string | null;
    }
  ): Promise<AttendanceRecord> => {
    const response =
      await attendanceApi.patch<AttendanceRecord>(
        `/records/${recordId}/`,
        payload,
        {
          headers: getAuthHeaders(),
        }
      );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();

    return response.data;
  },

  deleteAttendanceRecord: async (
    recordId: number
  ): Promise<void> => {
    await attendanceApi.delete(
      `/records/${recordId}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    attendanceCache.clearPrefix(
      cachePrefixes.rosters
    );

    clearAllSummaryCaches();
  },

  // ====================================================
  // Attendance summaries
  // ====================================================

  getSummary: async (
    params: GetSummaryParams
  ): Promise<StudentAttendanceSummaryResponse> => {
    if (params.student !== undefined) {
      const key = cacheKeys.summary(
        params.student,
        params.term
      );

      return attendanceCache.getOrLoad(
        key,
        async () => {
          const response =
            await attendanceApi.get<StudentAttendanceSummaryResponse>(
              "/summary/",
              {
                params,
                headers: getAuthHeaders(),
              }
            );

          return response.data;
        },
        CACHE_TTL.SHORT
      );
    }

    const selfKey =
      cacheKeys.selfSummary(params.term);

    return attendanceCache.getOrLoad(
      selfKey,
      async () => {
        const response =
          await attendanceApi.get<StudentAttendanceSummaryResponse>(
            "/summary/",
            {
              params,
              headers: getAuthHeaders(),
            }
          );

        attendanceCache.set(
          cacheKeys.summary(
            response.data.student.id,
            params.term
          ),
          response.data,
          CACHE_TTL.SHORT
        );

        return response.data;
      },
      CACHE_TTL.SHORT
    );
  },

  // ====================================================
  // Audit logs
  // ====================================================

  getLogs: async (
    filters?: AttendanceLogFilters
  ): Promise<AttendanceLog[]> => {
    const response = await attendanceApi.get<
      AttendanceLog[] |
      PaginatedResponse<AttendanceLog>
    >("/logs/", {
      params: filters,
      headers: getAuthHeaders(),
    });

    return normalizeList(response.data);
  },

  getRegisterLogs: async (
    registerId: number
  ): Promise<AttendanceLog[]> => {
    return AttendanceApi.getLogs({
      register: registerId,
    });
  },

  clearCache: (): void => {
    attendanceCache.clear();
  },
};

export default attendanceApi;