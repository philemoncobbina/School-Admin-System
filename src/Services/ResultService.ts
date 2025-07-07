// src/services/api.ts
import axios from 'axios';

// Base API URL
const API_URL = 'https://api.plvcmonline.uk/api';

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem('access_token');
  return { 
    headers: { 
      Authorization: `Bearer ${accessToken}` 
    } 
  };
};

// Type definitions
export interface Course {
  id?: number;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

export interface ClassCourse {
  id?: number;
  course_name: number | { name: string };
  class_name: string;
  term: string;
  is_active: boolean;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
}

export interface CourseResult {
  id?: number;
  class_course: number | ClassCourse;
  class_score: number;
  exam_score: number;
  remarks?: string;
  total_score?: number;
  grade?: string;
  position?: number; // New field
}

export interface Result {
  id?: number;
  student: number | Student;
  class_name: string;
  term: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduled_date?: string;
  published_date?: string;
  created_at?: string;
  updated_at?: string;
  course_results: CourseResult[];
  
  // New fields
  academic_year?: string;
  overall_position?: number;
  class_teacher_remarks?: string;
  promoted_to?: string;
  next_term_begins?: string;
  days_present?: number;
  days_absent?: number;
  total_days?: number; // Computed field
  attendance_percentage?: number; // Computed field
  total_score?: number; // Computed field
  average_score?: number; // Computed field
  report_card_pdf?: string; // New field for report card URL
}

export interface ResultChangeLog {
  id: number;
  changed_by: string | { first_name: string; last_name: string; email: string }; // Updated to include email
  changed_at: string;
  field_name: string;
  previous_value: string;
  new_value: string;
}

// API service
const apiService = {
  // Course operations
  courses: {
    getAll: async () => {
      const response = await axios.get(`${API_URL}/courses/`, getAuthHeaders());
      return response.data;
    },
    getById: async (id: number) => {
      const response = await axios.get(`${API_URL}/courses/${id}/`, getAuthHeaders());
      return response.data;
    },
    create: async (course: Course) => {
      const response = await axios.post(`${API_URL}/courses/`, course, getAuthHeaders());
      return response.data;
    },
    update: async (id: number, course: Course) => {
      const response = await axios.put(`${API_URL}/courses/${id}/`, course, getAuthHeaders());
      return response.data;
    },
    delete: async (id: number) => {
      const response = await axios.delete(`${API_URL}/courses/${id}/`, getAuthHeaders());
      return response.data;
    }
  },

  // Class Course operations
  classCourses: {
    getAll: async () => {
      const response = await axios.get(`${API_URL}/class-courses/`, getAuthHeaders());
      return response.data;
    },
    getById: async (id: number) => {
      const response = await axios.get(`${API_URL}/class-courses/${id}/`, getAuthHeaders());
      return response.data;
    },
    create: async (classCourse: ClassCourse) => {
      const response = await axios.post(`${API_URL}/class-courses/`, classCourse, getAuthHeaders());
      return response.data;
    },
    update: async (id: number, classCourse: ClassCourse) => {
      const response = await axios.put(`${API_URL}/class-courses/${id}/`, classCourse, getAuthHeaders());
      return response.data;
    },
    delete: async (id: number) => {
      const response = await axios.delete(`${API_URL}/class-courses/${id}/`, getAuthHeaders());
      return response.data;
    },
    getByClassAndTerm: async (className: string, term: string) => {
      const response = await axios.get(`${API_URL}/class-courses/by_class_and_term/`, {
        ...getAuthHeaders(),
        params: { class_name: className, term }
      });
      return response.data;
    },
    bulkAssign: async (assignments: ClassCourse[]) => {
      const response = await axios.post(`${API_URL}/class-courses/bulk_assign/`, assignments, getAuthHeaders());
      return response.data;
    }
  },

  // Result operations
  results: {
    getAll: async () => {
      const response = await axios.get(`${API_URL}/results/`, getAuthHeaders());
      return response.data;
    },
    getById: async (id: number) => {
      const response = await axios.get(`${API_URL}/results/${id}/`, getAuthHeaders());
      return response.data;
    },
    create: async (result: Result) => {
      const response = await axios.post(`${API_URL}/results/`, result, getAuthHeaders());
      return response.data;
    },
    update: async (id: number, result: Result) => {
      const response = await axios.put(`${API_URL}/results/${id}/`, result, getAuthHeaders());
      return response.data;
    },
    delete: async (id: number) => {
      const response = await axios.delete(`${API_URL}/results/${id}/`, getAuthHeaders());
      return response.data;
    },
    getStudentResults: async (studentId: number, className?: string, term?: string) => {
      const params: any = { student: studentId };
      if (className) params.class_name = className;
      if (term) params.term = term;
      
      const response = await axios.get(`${API_URL}/results/get_student_results/`, {
        ...getAuthHeaders(),
        params
      });
      return response.data;
    },
    getClassResults: async (className: string, term?: string) => {
      const params: any = { class_name: className };
      if (term) params.term = term;
      
      const response = await axios.get(`${API_URL}/results/get_class_results/`, {
        ...getAuthHeaders(),
        params
      });
      return response.data;
    },
    getChangeLog: async (resultId: number) => {
      const response = await axios.get(`${API_URL}/results/${resultId}/change_log/`, getAuthHeaders());
      return response.data as ResultChangeLog[];
    },
    getAvailableCourses: async (className: string, term: string) => {
      const response = await axios.get(`${API_URL}/results/get_available_courses/`, {
        ...getAuthHeaders(),
        params: { class_name: className, term }
      });
      return response.data;
    },
    getStudentsByClass: async (className: string) => {
      const response = await axios.get(`${API_URL}/results/get_students_by_class/`, {
        ...getAuthHeaders(),
        params: { class_name: className }
      });
      return response.data as Student[];
    },
    bulkUpdateStatus: async (
      className: string,
      term: string,
      status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED',
      scheduledDate: string | null = null
    ) => {
      const payload: any = {
        class_name: className,
        term: term,
        status: status
      };
      
      if (scheduledDate) {
        payload.scheduled_date = scheduledDate;
      }
           
      try {
        const response = await axios.post(
          `${API_URL}/results/bulk_update_status/`,
          payload,
          getAuthHeaders()
        );
        return response.data;
      } catch (error) {
        console.error('Bulk update error:', error.response?.data || error.message);
        throw error;
      }
    },
    downloadReportCard: async (resultId: number) => {
      const response = await axios.get(`${API_URL}/results/${resultId}/download_report_card/`, {
        ...getAuthHeaders(),
        responseType: 'blob' // Important for file downloads
      });
      return response.data;
    }
  },

  // Student results (for student users)
  studentResults: {
    getMyResults: async (term?: string, className?: string) => {
      const params: any = {};
      if (term) params.term = term;
      if (className) params.class_name = className;
      
      const response = await axios.get(`${API_URL}/my-results/`, {
        ...getAuthHeaders(),
        params
      });
      return response.data;
    }
  }
};

export default apiService;