import axios, { AxiosRequestConfig } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Same base as before (http://localhost:8000/api/job-applications/), built from the shared API_URL.
// Always ends with a slash.
const APPLICATIONS_URL = `${API_URL}job-applications/`;
const LOGS_URL = `${API_URL}job-application-logs/`;

// Types
export type EducationalLevel = 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'PHD';
export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';

export interface JobApplication {
    id: number;
    job_post: number;
    resume: File | string;
    status: ApplicationStatus;
    applied_at: string;
    updated_at: string;
    job_title: string;
    job_reference_number: string;
    first_name: string;
    last_name: string;
    email: string;
    educational_level: EducationalLevel;
    last_modified_by?: number;
}

export interface CreateJobApplicationDTO {
    job_post: number;
    resume: File;
    first_name: string;
    last_name: string;
    email: string;
    educational_level: EducationalLevel;
}

export interface UpdateJobApplicationDTO {
    status?: ApplicationStatus;
    educational_level?: EducationalLevel;
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface JobApplicationLog {
    id: number;
    application: number;
    user?: number;
    user_email: string;
    changed_fields: string;
    timestamp: string;
}

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. An axios.create() instance would not get them.
// Credentials travel in HttpOnly cookies, so nothing here builds auth headers.

class JobApplicationService {
    private static instance: JobApplicationService;
    private constructor() {}

    static getInstance(): JobApplicationService {
        if (!this.instance) this.instance = new JobApplicationService();
        return this.instance;
    }

    private async request<T>(
        method: string,
        url: string,
        data?: any,
        config: AxiosRequestConfig = {}
    ) {
        try {
            const response = await axios({ method, url, data, ...config });
            return response.data as T;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || 'An error occurred';
                throw new Error(message);
            }
            throw error;
        }
    }

    // Applicants are usually not signed in, so a 401 here must not send them to /login.
    // Axios sets the multipart Content-Type and boundary itself.
    createApplication(application: CreateJobApplicationDTO) {
        const formData = new FormData();
        Object.entries(application).forEach(([key, value]) => {
            formData.append(key, value instanceof Blob ? value : String(value));
        });
        return this.request<JobApplication>('POST', APPLICATIONS_URL, formData, {
            skipAuthRedirect: true,
        });
    }

    getMyApplications() {
        return this.request<JobApplication[]>('GET', APPLICATIONS_URL);
    }

    getApplicationById(id: number) {
        return this.request<JobApplication>('GET', `${APPLICATIONS_URL}${id}/`);
    }

    updateApplication(id: number, updates: UpdateJobApplicationDTO) {
        return this.request<JobApplication>('PATCH', `${APPLICATIONS_URL}${id}/`, updates);
    }

    deleteApplication(id: number) {
        return this.request<void>('DELETE', `${APPLICATIONS_URL}${id}/`);
    }

    // New methods for the logging system
    getApplicationLogs(applicationId: number) {
        return this.request<JobApplicationLog[]>('GET', `${APPLICATIONS_URL}${applicationId}/logs/`);
    }

    // Optional: Method to get all logs (if needed for admin purposes)
    getAllLogs() {
        return this.request<JobApplicationLog[]>('GET', LOGS_URL);
    }

    // Optional: Method to filter logs by user, date range, etc.
    filterLogs(filters: { user_email?: string; from_date?: string; to_date?: string }) {
        const params: Record<string, string> = {};

        if (filters.user_email) params.user_email = filters.user_email;
        if (filters.from_date) params.from_date = filters.from_date;
        if (filters.to_date) params.to_date = filters.to_date;

        return this.request<JobApplicationLog[]>('GET', LOGS_URL, undefined, { params });
    }
}

export const jobApplicationService = JobApplicationService.getInstance();