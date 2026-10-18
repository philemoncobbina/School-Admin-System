// src/services/booklistService.ts
import axios, { AxiosResponse } from 'axios';
import { API_URL } from './http'; // adjust the path if http.ts lives elsewhere

// Types
export interface BookListItem {
  id?: number;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  is_required: boolean;
  order: number;
  total_price: number;
}

export interface BookList {
  id?: number;
  title: string;
  academic_year: string; // Changed from number to string
  class_name: string;
  class_name_display?: string;
  status: 'draft' | 'published' | 'scheduled';
  status_display?: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
  publish_date?: string | null;
  scheduled_date?: string | null;
  description: string | null;
  total_price: number;
  items: BookListItem[];
}

// Same base as before (http://localhost:8000/api/booklists/), built from the shared API_URL.
// Always ends with a slash.
const BOOKLISTS_URL = `${API_URL}booklists/`;

// Uses the global axios on purpose: the cookie, CSRF and refresh interceptors
// installed by initAuth() live on it. Credentials travel in HttpOnly cookies,
// so nothing here builds auth headers.

// BookList API calls
export const getBookLists = async (): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(BOOKLISTS_URL);

  // Add console.log to inspect the response
  console.log('BookLists API Response:', {
    status: response.status,
    data: response.data,
    firstItemTotalPrice: response.data[0]?.total_price,
    firstItemPrices: response.data[0]?.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      itemTotal: item.total_price,
    })),
  });

  return response.data;
};

export const getBookList = async (id: number): Promise<BookList> => {
  const response: AxiosResponse<BookList> = await axios.get(`${BOOKLISTS_URL}${id}/`);
  return response.data;
};

export const createBookList = async (bookList: Omit<BookList, 'id'>): Promise<BookList> => {
  const response: AxiosResponse<BookList> = await axios.post(BOOKLISTS_URL, bookList);
  return response.data;
};

export const updateBookList = async (id: number, bookList: BookList): Promise<BookList> => {
  const response: AxiosResponse<BookList> = await axios.put(`${BOOKLISTS_URL}${id}/`, bookList);
  return response.data;
};

export const deleteBookList = async (id: number): Promise<void> => {
  await axios.delete(`${BOOKLISTS_URL}${id}/`);
};

export const publishBookList = async (id: number): Promise<BookList> => {
  const response: AxiosResponse<BookList> = await axios.post(
    `${BOOKLISTS_URL}${id}/publish/`,
    {}
  );
  return response.data;
};

export const scheduleBookList = async (id: number, scheduledDate: string): Promise<BookList> => {
  const response: AxiosResponse<BookList> = await axios.post(
    `${BOOKLISTS_URL}${id}/schedule/`,
    { scheduled_date: scheduledDate } // Changed from publish_date to scheduled_date
  );
  return response.data;
};

export const getDraftBookLists = async (): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(`${BOOKLISTS_URL}draft/`);
  return response.data;
};

// For students
export const getMyClassBookLists = async (academicYear?: string): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(`${BOOKLISTS_URL}my_class/`, {
    params: academicYear ? { academic_year: academicYear } : undefined,
  });
  return response.data;
};

export const getCurrentClassBookLists = async (): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(`${BOOKLISTS_URL}current_class/`);
  return response.data;
};

export const getHistoricalBookLists = async (): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(`${BOOKLISTS_URL}history/`);
  return response.data;
};

export const getPreviousClassesBookLists = async (): Promise<BookList[]> => {
  const response: AxiosResponse<BookList[]> = await axios.get(`${BOOKLISTS_URL}previous_classes/`);
  return response.data;
};

// Updated Class options from the CustomUser model
export const CLASS_OPTIONS = [
  { value: 'Creche', label: 'Creche' },
  { value: 'Nursery', label: 'Nursery' },
  { value: 'KG 1', label: 'KG 1' },
  { value: 'KG 2', label: 'KG 2' },
  { value: 'Class 1', label: 'Class 1' },
  { value: 'Class 2', label: 'Class 2' },
  { value: 'Class 3', label: 'Class 3' },
  { value: 'Class 4', label: 'Class 4' },
  { value: 'Class 5', label: 'Class 5' },
  { value: 'Class 6', label: 'Class 6' },
  { value: 'JHS 1', label: 'JHS 1' },
  { value: 'JHS 2', label: 'JHS 2' },
  { value: 'JHS 3', label: 'JHS 3' },
];