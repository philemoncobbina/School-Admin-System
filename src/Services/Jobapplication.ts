import axios from 'axios';

const API_BASE_URL = 'https://api.plvcmonline.uk/api';

// Get authentication headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token found');
    return { Authorization: `Bearer ${token}` };
};

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

class JobApplicationService {
    private static instance: JobApplicationService;
    private constructor() {}

    static getInstance(): JobApplicationService {
        if (!this.instance) this.instance = new JobApplicationService();
        return this.instance;
    }

    private async request<T>(method: string, url: string, data?: any, headers = {}) {
        try {
            const response = await axios({ method, url, data, headers });
            return response.data as T;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || 'An error occurred';
                throw new Error(message);
            }
            throw error;
        }
    }

    createApplication(application: CreateJobApplicationDTO) {
        const formData = new FormData();
        Object.entries(application).forEach(([key, value]) => {
            formData.append(key, value);
        });
        return this.request<JobApplication>('POST', `${API_BASE_URL}/job-applications/`, formData, {
            'Content-Type': 'multipart/form-data',
        });
    }

    getMyApplications() {
        return this.request<JobApplication[]>('GET', `${API_BASE_URL}/job-applications/`, null, getAuthHeaders());
    }

    getApplicationById(id: number) {
        return this.request<JobApplication>('GET', `${API_BASE_URL}/job-applications/${id}/`, null, getAuthHeaders());
    }

    updateApplication(id: number, updates: UpdateJobApplicationDTO) {
        return this.request<JobApplication>('PATCH', `${API_BASE_URL}/job-applications/${id}/`, updates, {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
        });
    }

    deleteApplication(id: number) {
        return this.request<void>('DELETE', `${API_BASE_URL}/job-applications/${id}/`, null, getAuthHeaders());
    }

    // New methods for the logging system
    getApplicationLogs(applicationId: number) {
        return this.request<JobApplicationLog[]>(
            'GET', 
            `${API_BASE_URL}/job-applications/${applicationId}/logs/`, 
            null, 
            getAuthHeaders()
        );
    }

    // Optional: Method to get all logs (if needed for admin purposes)
    getAllLogs() {
        return this.request<JobApplicationLog[]>(
            'GET',
            `${API_BASE_URL}/job-application-logs/`,
            null,
            getAuthHeaders()
        );
    }

    // Optional: Method to filter logs by user, date range, etc.
    filterLogs(filters: { user_email?: string, from_date?: string, to_date?: string }) {
        const queryParams = new URLSearchParams();
        
        if (filters.user_email) queryParams.append('user_email', filters.user_email);
        if (filters.from_date) queryParams.append('from_date', filters.from_date);
        if (filters.to_date) queryParams.append('to_date', filters.to_date);
        
        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}/job-application-logs/${queryString ? `?${queryString}` : ''}`;
        
        return this.request<JobApplicationLog[]>('GET', url, null, getAuthHeaders());
    }
}

export const jobApplicationService = JobApplicationService.getInstance();