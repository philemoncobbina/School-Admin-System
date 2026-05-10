// studentAuthService.ts

import axios, { AxiosResponse } from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────

export type RelationshipType =
  | 'father' | 'mother' | 'guardian' | 'grandparent'
  | 'sibling' | 'uncle' | 'aunt' | 'other';

export type IdType =
  | 'national_id' | 'passport' | 'drivers_license' | 'voters_id' | 'other';

export interface ParentGuardian {
  id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  relationship: RelationshipType;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  street_address?: string;
  city?: string;
  state_region?: string;
  postal_code?: string;
  id_type?: IdType;
  id_number?: string;
  is_primary_contact: boolean;
}

export interface StudentUser {
  id?: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  index_number: string;
  class_name: string;
  role?: string;
  guardians?: ParentGuardian[];
}

export interface StudentLoginCredentials {
  email?: string;
  index_number?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: StudentUser;
}

export interface BatchCreateStudentResponse {
  message: string;
  created_students: StudentUser[];
  errors: any[];
}

// ── Shared option lists ────────────────────────────────────────────────────

export const CLASS_OPTIONS = [
  { value: 'Creche',   label: 'Creche'   },
  { value: 'Nursery',  label: 'Nursery'  },
  { value: 'KG 1',     label: 'KG 1'     },
  { value: 'KG 2',     label: 'KG 2'     },
  { value: 'Class 1',  label: 'Class 1'  },
  { value: 'Class 2',  label: 'Class 2'  },
  { value: 'Class 3',  label: 'Class 3'  },
  { value: 'Class 4',  label: 'Class 4'  },
  { value: 'Class 5',  label: 'Class 5'  },
  { value: 'Class 6',  label: 'Class 6'  },
  { value: 'JHS 1',    label: 'JHS 1'    },
  { value: 'JHS 2',    label: 'JHS 2'    },
  { value: 'JHS 3',    label: 'JHS 3'    },
];

export const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'father',      label: 'Father'      },
  { value: 'mother',      label: 'Mother'      },
  { value: 'guardian',    label: 'Guardian'    },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling',     label: 'Sibling'     },
  { value: 'uncle',       label: 'Uncle'       },
  { value: 'aunt',        label: 'Aunt'        },
  { value: 'other',       label: 'Other'       },
];

export const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: 'national_id',     label: 'National ID'       },
  { value: 'passport',        label: 'Passport'          },
  { value: 'drivers_license', label: "Driver's License"  },
  { value: 'voters_id',       label: "Voter's ID"        },
  { value: 'other',           label: 'Other'             },
];

// ── Axios instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Service ────────────────────────────────────────────────────────────────

const studentAuthService = {
  createStudent: (
    studentData: StudentUser & { password: string }
  ): Promise<AxiosResponse> => api.post('student-signup/', studentData),

  batchCreateStudents: (
    studentsData: (StudentUser & { password: string })[]
  ): Promise<BatchCreateStudentResponse> =>
    api.post('batch-create/', { students: studentsData }).then((r) => r.data),

  login: async (credentials: StudentLoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('login/', credentials);
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('userData', JSON.stringify(data.user));
    }
    return data;
  },

  logout: (): void => {
    ['access_token', 'refresh_token', 'userData'].forEach((k) =>
      localStorage.removeItem(k)
    );
  },

  getCurrentUser: (): StudentUser | null => {
    const raw = localStorage.getItem('userData');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn: (): boolean => !!localStorage.getItem('access_token'),

  isStudent: (): boolean => studentAuthService.getCurrentUser()?.role === 'student',

  // Kept for backward-compat — components can also import CLASS_OPTIONS directly
  getClassOptions: () => CLASS_OPTIONS,

  getProtectedData: (): Promise<any> =>
    api.get('protected-endpoint/').then((r) => r.data),
};

export default studentAuthService;