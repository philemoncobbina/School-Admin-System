// src/Services/ResultService.ts

import axios, { AxiosError } from 'axios';
import { resultsCache, CACHE_TTL, cacheKeys } from './resultsCache';

const API_URL = 'https://api.cobbina.uk/api';

const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('access_token');

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

export interface Course {
  id?: number;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  created_by_name?: string;
}

export interface ClassCourse {
  id?: number;
  course?: number | Course;
  course_name?: string;
  class_name: string;
  term: string;
  term_display?: string;
  is_active?: boolean;
  teacher_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
}

export interface StudentCourse {
  id: number;
  course_id: number;
  course_name: string;
  course_code: string;
  class_name: string;
  term: string;
  term_display: string;
  teacher_name: string;
  teacher_email: string;
  teacher_phone: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
  index_number?: string;
  username?: string;
  role?: string;
  is_active?: boolean;
}

export interface CourseResult {
  id?: number;
  class_course: number | ClassCourse;
  course_name?: string;
  course_code?: string;
  class_score: number;
  exam_score: number;
  remarks?: string;
  total_score?: number;
  grade?: string;
  position?: number;
  position_context?: string;
}

export interface Result {
  id?: number;

  student: number | Student;
  student_name?: string;

  class_name: string;
  term: string;
  term_display?: string;
  academic_year?: string;

  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduled_date?: string | null;
  published_date?: string | null;

  created_at?: string;
  updated_at?: string;

  course_results: CourseResult[];

  overall_position?: number | null;
  position_context?: string;
  class_teacher_remarks?: string | null;
  promoted_to?: string | null;
  next_term_begins?: string | null;

  report_card_pdf?: string | null;
  report_card_url?: string | null;

  // Attendance fields are now read-only backend-calculated fields.
  // Do not send these when creating or updating results.
  days_present?: number;
  days_absent?: number;
  total_days?: number;
  total_school_days?: number;
  total_marked_attendance_days?: number;
  days_unmarked?: number;
  attendance_percentage?: number;
  marked_attendance_percentage?: number;

  total_score?: number;
  average_score?: number;
}

export interface CreateResultPayload {
  student: number;
  class_name: string;
  term: string;
  academic_year: string;
  class_teacher_remarks: string;
  promoted_to?: string | null;
  next_term_begins: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduled_date?: string | null;
  course_results: Array<{
    class_course: number;
    class_score: number;
    exam_score: number;
    remarks?: string;
  }>;
}

export interface UpdateResultPayload {
  student?: number;
  class_name?: string;
  term?: string;
  academic_year?: string;
  class_teacher_remarks?: string;
  promoted_to?: string | null;
  next_term_begins?: string | null;
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduled_date?: string | null;
  course_results?: Array<{
    class_course: number;
    class_score: number;
    exam_score: number;
    remarks?: string;
  }>;
}

export interface ResultChangeLog {
  id: number;
  result: number;
  changed_by: string;
  changed_by_name?: string;
  changed_at: string;
  field_name: string;
  previous_value: string | null;
  new_value: string | null;
}

export interface AttendanceSummaryResponse {
  result_id: number;
  student: {
    id: number;
    name: string;
    class_name: string;
  };
  academic_year: string;
  term: string;
  term_display: string;
  attendance: {
    days_present: number;
    days_absent: number;
    total_days: number;
    total_school_days: number;
    total_marked_attendance_days: number;
    days_unmarked: number;
    attendance_percentage: number;
    marked_attendance_percentage: number;
  };
}

export interface BulkUpdateStatusResponse {
  message: string;
  class_name?: string;
  term?: string;
  academic_year?: string;
  updated_count?: number;
  queued_count?: number;
}

const buildQueryParams = (params: Record<string, any>) => {
  const cleanParams: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  });

  return cleanParams;
};

const handleApiError = (error: unknown) => {
  const axiosError = error as AxiosError;

  console.error('API error:', axiosError.response?.data || axiosError.message);

  throw error;
};

const apiService = {
  courses: {
    getAll: async (): Promise<Course[]> => {
      try {
        const response = await axios.get(`${API_URL}/courses/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getById: async (id: number): Promise<Course> => {
      try {
        const response = await axios.get(`${API_URL}/courses/${id}/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (course: Course): Promise<Course> => {
      try {
        const response = await axios.post(`${API_URL}/courses/`, course, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, course: Partial<Course>): Promise<Course> => {
      try {
        const response = await axios.put(`${API_URL}/courses/${id}/`, course, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, course: Partial<Course>): Promise<Course> => {
      try {
        const response = await axios.patch(`${API_URL}/courses/${id}/`, course, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      try {
        const response = await axios.delete(`${API_URL}/courses/${id}/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },

  classCourses: {
    getAll: async (): Promise<ClassCourse[]> => {
      try {
        const response = await axios.get(`${API_URL}/class-courses/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getById: async (id: number): Promise<ClassCourse> => {
      try {
        const response = await axios.get(`${API_URL}/class-courses/${id}/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (classCourse: ClassCourse): Promise<ClassCourse> => {
      try {
        const response = await axios.post(
          `${API_URL}/class-courses/`,
          classCourse,
          getAuthHeaders()
        );

        // The response always carries class_name/term regardless of what
        // was in the request payload - safest thing to key invalidation on.
        resultsCache.delete(
          cacheKeys.classCoursesByClassAndTerm(response.data.class_name, response.data.term)
        );
        resultsCache.delete(
          cacheKeys.availableCourses(response.data.class_name, response.data.term)
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, classCourse: Partial<ClassCourse>): Promise<ClassCourse> => {
      try {
        const response = await axios.put(
          `${API_URL}/class-courses/${id}/`,
          classCourse,
          getAuthHeaders()
        );

        // class_name/term could have changed - the response reflects the
        // NEW values, but we don't know the OLD ones here (no prior read).
        // A targeted delete on the new key plus a prefix clear covers both
        // without an extra round trip just for cache bookkeeping.
        resultsCache.delete(
          cacheKeys.classCoursesByClassAndTerm(response.data.class_name, response.data.term)
        );
        resultsCache.delete(
          cacheKeys.availableCourses(response.data.class_name, response.data.term)
        );
        if (classCourse.class_name || classCourse.term) {
          resultsCache.clearPrefix('class-courses:');
          resultsCache.clearPrefix('available-courses:');
        }

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, classCourse: Partial<ClassCourse>): Promise<ClassCourse> => {
      try {
        const response = await axios.patch(
          `${API_URL}/class-courses/${id}/`,
          classCourse,
          getAuthHeaders()
        );

        resultsCache.delete(
          cacheKeys.classCoursesByClassAndTerm(response.data.class_name, response.data.term)
        );
        resultsCache.delete(
          cacheKeys.availableCourses(response.data.class_name, response.data.term)
        );
        if (classCourse.class_name || classCourse.term) {
          resultsCache.clearPrefix('class-courses:');
          resultsCache.clearPrefix('available-courses:');
        }

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      // A DELETE response has no body, and we don't have the class_name/term
      // for this id without a prior read - broad clear is the safe choice.
      // ClassCourse deletion is rare enough that this is cheap either way.
      try {
        const response = await axios.delete(`${API_URL}/class-courses/${id}/`, getAuthHeaders());
        resultsCache.clearPrefix('class-courses:');
        resultsCache.clearPrefix('available-courses:');
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    getByClassAndTerm: async (
      className: string,
      term: string
    ): Promise<ClassCourse[]> => {
      const key = cacheKeys.classCoursesByClassAndTerm(className, term);
      const cached = resultsCache.get<ClassCourse[]>(key);
      if (cached) return cached;

      try {
        const response = await axios.get(`${API_URL}/class-courses/by_class_and_term/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        resultsCache.set(key, response.data, CACHE_TTL.MEDIUM);
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    bulkAssign: async (assignments: ClassCourse[]): Promise<any> => {
      try {
        const response = await axios.post(
          `${API_URL}/class-courses/bulk_assign/`,
          assignments,
          getAuthHeaders()
        );

        // response.data.created is a list of the newly-created ClassCourse
        // objects - invalidate every distinct class_name/term pair touched.
        const created: ClassCourse[] = response.data?.created || [];
        const touched = new Set(created.map((c) => `${c.class_name}::${c.term}`));

        for (const pair of touched) {
          const [className, term] = pair.split('::');
          resultsCache.delete(cacheKeys.classCoursesByClassAndTerm(className, term));
          resultsCache.delete(cacheKeys.availableCourses(className, term));
        }

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },

  results: {
    getAll: async (filters?: {
      student?: number;
      class_name?: string;
      term?: string;
      academic_year?: string;
      status?: string;
    }): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/results/`, {
          ...getAuthHeaders(),
          params: buildQueryParams(filters || {}),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getById: async (id: number): Promise<Result> => {
      try {
        const response = await axios.get(`${API_URL}/results/${id}/`, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (result: CreateResultPayload): Promise<Result> => {
      try {
        const response = await axios.post(`${API_URL}/results/`, result, getAuthHeaders());
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, result: UpdateResultPayload): Promise<Result> => {
      try {
        const response = await axios.put(`${API_URL}/results/${id}/`, result, getAuthHeaders());
        // This result's attendance-summary snapshot may now be stale
        // (location/student change on the backend recomputes it).
        resultsCache.delete(cacheKeys.attendanceSummary(id));
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, result: UpdateResultPayload): Promise<Result> => {
      try {
        const response = await axios.patch(`${API_URL}/results/${id}/`, result, getAuthHeaders());
        resultsCache.delete(cacheKeys.attendanceSummary(id));
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      try {
        const response = await axios.delete(`${API_URL}/results/${id}/`, getAuthHeaders());
        resultsCache.delete(cacheKeys.attendanceSummary(id));
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    getStudentResults: async (
      studentId: number,
      className?: string,
      term?: string,
      academicYear?: string
    ): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/results/get_student_results/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            student: studentId,
            class_name: className,
            term,
            academic_year: academicYear,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getClassResults: async (
      className: string,
      term?: string,
      academicYear?: string
    ): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/results/get_class_results/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
            academic_year: academicYear,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getChangeLog: async (resultId: number): Promise<ResultChangeLog[]> => {
      try {
        const response = await axios.get(
          `${API_URL}/results/${resultId}/change_log/`,
          getAuthHeaders()
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getAvailableCourses: async (
      className: string,
      term: string
    ): Promise<ClassCourse[]> => {
      const key = cacheKeys.availableCourses(className, term);
      const cached = resultsCache.get<ClassCourse[]>(key);
      if (cached) return cached;

      try {
        const response = await axios.get(`${API_URL}/results/get_available_courses/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        resultsCache.set(key, response.data, CACHE_TTL.MEDIUM);
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getStudentsByClass: async (className: string): Promise<Student[]> => {
      const key = cacheKeys.studentsByClass(className);
      const cached = resultsCache.get<Student[]>(key);
      if (cached) return cached;

      try {
        const response = await axios.get(`${API_URL}/results/get_students_by_class/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
          }),
        });

        resultsCache.set(key, response.data, CACHE_TTL.SHORT);
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getAttendanceSummary: async (
      resultId: number
    ): Promise<AttendanceSummaryResponse> => {
      const key = cacheKeys.attendanceSummary(resultId);
      const cached = resultsCache.get<AttendanceSummaryResponse>(key);
      if (cached) return cached;

      try {
        const response = await axios.get(
          `${API_URL}/results/${resultId}/attendance_summary/`,
          getAuthHeaders()
        );

        resultsCache.set(key, response.data, CACHE_TTL.SHORT);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    recalculatePositions: async (
      className: string,
      term: string,
      academicYear?: string
    ): Promise<any> => {
      // Recalculation only touches overall_position / course position -
      // neither available_courses, students-by-class, nor attendance
      // summaries depend on those, so nothing to invalidate here.
      try {
        const response = await axios.post(
          `${API_URL}/results/recalculate_positions/`,
          {
            class_name: className,
            term,
            academic_year: academicYear,
          },
          getAuthHeaders()
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    bulkUpdateStatus: async (
      className: string,
      term: string,
      status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED',
      scheduledDate: string | null = null,
      academicYear?: string
    ): Promise<BulkUpdateStatusResponse> => {
      const payload: any = {
        class_name: className,
        term,
        status,
      };

      if (academicYear) {
        payload.academic_year = academicYear;
      }

      if (scheduledDate) {
        payload.scheduled_date = scheduledDate;
      }

      // Same reasoning as recalculatePositions - status/scheduled_date/
      // published_date changes don't touch any cached response here.
      try {
        const response = await axios.post(
          `${API_URL}/results/bulk_update_status/`,
          payload,
          getAuthHeaders()
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    downloadReportCard: async (resultId: number): Promise<Blob> => {
      try {
        const response = await axios.get(
          `${API_URL}/results/${resultId}/download_report_card/`,
          {
            ...getAuthHeaders(),
            responseType: 'blob',
          }
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },

  studentResults: {
    getMyResults: async (
      term?: string,
      className?: string,
      academicYear?: string
    ): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/my-results/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            term,
            class_name: className,
            academic_year: academicYear,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getCurrentClassResults: async (
      term?: string,
      academicYear?: string
    ): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/my-results/current_class/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            term,
            academic_year: academicYear,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getPreviousClassResults: async (
      className: string,
      term: string,
      academicYear?: string
    ): Promise<Result[]> => {
      try {
        const response = await axios.get(`${API_URL}/my-results/previous_classes/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
            academic_year: academicYear,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getAttendanceSummary: async (
      resultId: number
    ): Promise<AttendanceSummaryResponse> => {
      // NOTE: intentionally NOT cached under the same key as
      // results.getAttendanceSummary above - that endpoint (/results/<id>/)
      // is staff/principal-scoped, this one (/my-results/<id>/) is the
      // student's own view. They happen to return the same shape today,
      // but keying them together would be a correctness bug waiting to
      // happen the moment either endpoint's permission logic diverges.
      try {
        const response = await axios.get(
          `${API_URL}/my-results/${resultId}/attendance_summary/`,
          getAuthHeaders()
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },

  studentCourses: {
    // NOTE: nothing in this section is cached, matching the decision made
    // for StudentCoursesViewSet on the backend - every one of these
    // branches on the requesting user (their own class, their class
    // history, a 403 for other classes), so caching by class_name+term
    // alone risks serving one student's permitted response to another.
    getMyCourses: async (
      term?: string,
      className?: string
    ): Promise<{
      class_name: string;
      term: string;
      total_courses: number;
      courses: StudentCourse[];
    }> => {
      try {
        const response = await axios.get(`${API_URL}/my-courses/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            term,
            class_name: className,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    getByClassAndTerm: async (
      className: string,
      term: string
    ): Promise<{
      class_name: string;
      term: string;
      total_courses: number;
      courses: StudentCourse[];
    }> => {
      try {
        const response = await axios.get(`${API_URL}/my-courses/by_class_and_term/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    getPreviousCourses: async (
      className: string,
      term: string
    ): Promise<{
      class_name: string;
      term: string;
      total_courses: number;
      courses: StudentCourse[];
    }> => {
      try {
        const response = await axios.get(`${API_URL}/my-courses/previous/`, {
          ...getAuthHeaders(),
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },
};

export default apiService;