// src/Services/ResultService.ts

import axios, { AxiosError } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same base as before (http://localhost:8000/api), built from the shared API_URL.
// Always ends with a slash, so endpoints below have no leading slash.
//
// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. Credentials travel in HttpOnly cookies,
// so nothing here builds auth headers.

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
        const response = await axios.get(`${API_URL}courses/`);
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getById: async (id: number): Promise<Course> => {
      try {
        const response = await axios.get(`${API_URL}courses/${id}/`);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (course: Course): Promise<Course> => {
      try {
        const response = await axios.post(`${API_URL}courses/`, course);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, course: Partial<Course>): Promise<Course> => {
      try {
        const response = await axios.put(`${API_URL}courses/${id}/`, course);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, course: Partial<Course>): Promise<Course> => {
      try {
        const response = await axios.patch(`${API_URL}courses/${id}/`, course);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      try {
        const response = await axios.delete(`${API_URL}courses/${id}/`);
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
        const response = await axios.get(`${API_URL}class-courses/`);
        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getById: async (id: number): Promise<ClassCourse> => {
      try {
        const response = await axios.get(`${API_URL}class-courses/${id}/`);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (classCourse: ClassCourse): Promise<ClassCourse> => {
      try {
        const response = await axios.post(`${API_URL}class-courses/`, classCourse);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, classCourse: Partial<ClassCourse>): Promise<ClassCourse> => {
      try {
        const response = await axios.put(`${API_URL}class-courses/${id}/`, classCourse);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, classCourse: Partial<ClassCourse>): Promise<ClassCourse> => {
      try {
        const response = await axios.patch(`${API_URL}class-courses/${id}/`, classCourse);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      try {
        const response = await axios.delete(`${API_URL}class-courses/${id}/`);
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
      try {
        const response = await axios.get(`${API_URL}class-courses/by_class_and_term/`, {
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    bulkAssign: async (assignments: ClassCourse[]): Promise<any> => {
      try {
        const response = await axios.post(
          `${API_URL}class-courses/bulk_assign/`,
          assignments
        );

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
        const response = await axios.get(`${API_URL}results/`, {
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
        const response = await axios.get(`${API_URL}results/${id}/`);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    create: async (result: CreateResultPayload): Promise<Result> => {
      try {
        const response = await axios.post(`${API_URL}results/`, result);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    update: async (id: number, result: UpdateResultPayload): Promise<Result> => {
      try {
        const response = await axios.put(`${API_URL}results/${id}/`, result);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    partialUpdate: async (id: number, result: UpdateResultPayload): Promise<Result> => {
      try {
        const response = await axios.patch(`${API_URL}results/${id}/`, result);
        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },

    delete: async (id: number): Promise<any> => {
      try {
        const response = await axios.delete(`${API_URL}results/${id}/`);
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
        const response = await axios.get(`${API_URL}results/get_student_results/`, {
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
        const response = await axios.get(`${API_URL}results/get_class_results/`, {
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
        const response = await axios.get(`${API_URL}results/${resultId}/change_log/`);

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
      try {
        const response = await axios.get(`${API_URL}results/get_available_courses/`, {
          params: buildQueryParams({
            class_name: className,
            term,
          }),
        });

        return response.data;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },

    getStudentsByClass: async (className: string): Promise<Student[]> => {
      try {
        const response = await axios.get(`${API_URL}results/get_students_by_class/`, {
          params: buildQueryParams({
            class_name: className,
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
      try {
        const response = await axios.get(
          `${API_URL}results/${resultId}/attendance_summary/`
        );

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
      try {
        const response = await axios.post(`${API_URL}results/recalculate_positions/`, {
          class_name: className,
          term,
          academic_year: academicYear,
        });

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

      try {
        const response = await axios.post(
          `${API_URL}results/bulk_update_status/`,
          payload
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
          `${API_URL}results/${resultId}/download_report_card/`,
          {
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
        const response = await axios.get(`${API_URL}my-results/`, {
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
        const response = await axios.get(`${API_URL}my-results/current_class/`, {
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
        const response = await axios.get(`${API_URL}my-results/previous_classes/`, {
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
      try {
        const response = await axios.get(
          `${API_URL}my-results/${resultId}/attendance_summary/`
        );

        return response.data;
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  },

  studentCourses: {
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
        const response = await axios.get(`${API_URL}my-courses/`, {
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
        const response = await axios.get(`${API_URL}my-courses/by_class_and_term/`, {
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
        const response = await axios.get(`${API_URL}my-courses/previous/`, {
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