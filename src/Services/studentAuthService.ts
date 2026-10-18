// studentAuthService.ts

import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere
import {
  getStoredUser,
  initSessionTimers,
  isLoggedInSync,
  logout as sharedLogout,
} from './Login'; // adjust the path if Login.ts lives elsewhere

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
  // A regular class ('Class 4', 'JHS 2', ...) or a status ('Graduated' | 'Stopped')
  class_name: string;
  // Required when class_name === 'Graduated'
  graduation_year?: number | null;
  // Required when class_name === 'Stopped'
  stopped_class?: string | null;
  stop_reason?: string;
  stop_year?: number | null;
  role?: string;
  guardians?: ParentGuardian[];
}

export interface StudentLoginCredentials {
  email?: string;
  index_number?: string;
  password: string;
}

// Tokens are no longer part of the response: they travel in HttpOnly cookies.
export interface AuthResponse {
  user: StudentUser;
}

export interface BatchCreateStudentResponse {
  message: string;
  created_students: StudentUser[];
  errors: any[];
}

// ── Student status constants (must match CustomUser.GRADUATED / STOPPED) ───

export const GRADUATED_STATUS = 'Graduated';
export const STOPPED_STATUS = 'Stopped';

// Earliest year accepted for graduation / stopping year (matches backend MIN_STATUS_YEAR)
export const MIN_STATUS_YEAR = 1990;

// ── Shared option lists ────────────────────────────────────────────────────

// Regular classes only. Use this anywhere a student is being placed in a class
// (sign-up, batch create, billing, attendance, book lists, "class stopped at", ...).
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

// Non-class statuses a student can have.
export const STATUS_OPTIONS = [
  { value: GRADUATED_STATUS, label: 'Graduated'      },
  { value: STOPPED_STATUS,   label: 'Stopped School' },
];

// Regular classes + statuses. Use this only where a student's *current standing*
// is edited or filtered (e.g. User Management).
export const STUDENT_CLASS_OPTIONS = [...CLASS_OPTIONS, ...STATUS_OPTIONS];

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

// ── Client-side session keys (must match Login.ts) ─────────────────────────

const USER_KEY = 'user';
const LOGIN_TIME_KEY = 'loginTime';
const OLD_KEYS = ['access_token', 'refresh_token', 'userData'];

// ── Service ────────────────────────────────────────────────────────────────
// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.

const studentAuthService = {
  createStudent: (
    studentData: StudentUser & { password: string }
  ): Promise<AxiosResponse> => axios.post(`${API_URL}student-signup/`, studentData),

  batchCreateStudents: (
    studentsData: (StudentUser & { password: string })[]
  ): Promise<BatchCreateStudentResponse> =>
    axios
      .post(`${API_URL}batch-create/`, { students: studentsData })
      .then((r) => r.data),

  login: async (credentials: StudentLoginCredentials): Promise<AuthResponse> => {
    // skipAuthRedirect: a wrong password returns 401 and the page must stay on the
    // login form so the error can be shown, not reload to /login.
    const { data } = await axios.post(`${API_URL}login/`, credentials, {
      skipAuthRedirect: true,
    });

    if (data.user) {
      // Same keys as Login.ts, so the idle/max-session timers and route guards work.
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
      OLD_KEYS.forEach((k) => localStorage.removeItem(k));
      initSessionTimers();
    }

    return { user: data.user };
  },

  // Now async: it also clears the cookies on the server, then redirects to /login.
  // Callers that ignore the return value keep working.
  logout: (): Promise<void> => sharedLogout(),

  getCurrentUser: (): StudentUser | null =>
    // Login.ts types this as AuthUser, but it stores whatever the server returned.
    getStoredUser() as unknown as StudentUser | null,

  isLoggedIn: (): boolean => isLoggedInSync(),

  isStudent: (): boolean => studentAuthService.getCurrentUser()?.role === 'student',

  // Kept for backward-compat — components can also import CLASS_OPTIONS directly.
  // Returns regular classes only (no Graduated / Stopped).
  getClassOptions: () => CLASS_OPTIONS,

  getProtectedData: (): Promise<any> =>
    axios.get(`${API_URL}protected-endpoint/`).then((r) => r.data),
};

export default studentAuthService;