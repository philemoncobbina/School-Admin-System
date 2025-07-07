import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Layouts
import SideBar from './layouts/HomePage/SideBar';
import ResultEditView from './layouts/Results/ResultEditView';

// Pages
import HomePage from './Pages/HomePage';
import SignupPage from './Pages/SignupPage';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import Reservations from './Pages/Reservations';
import ComplaintForms from './Pages/ComplaintForms';
import SubscriptionForms from './Pages/SubscriptionForms';
import Admissions from './Pages/Admissions';
import EditComplain from './Pages/EditComplain';
import EditReservation from './layouts/Reservations/EditReservation';
import AdmissionReview from './Pages/AdmissionReview';
import TicketPage from './Pages/TicketPage';
import TicketEditpage from './Pages/TicketEditpage';
import UseradminPage from './Pages/UseradminPage';
import JobpostPage from './Pages/JobpostPage';
import JobPostEditPage from './Pages/JobPostEditPage';
import Addjobpost from './Pages/Addjobpost';
import Jobapplicationpage from './Pages/Jobapplicationpage';
import EditJobapplicationpage from './Pages/EditJobapplicationpage';
import StudentAuthPage from './Pages/StudentAuthPage';
import CreateBookListpage from './Pages/CreateBookListpage';
import BookListPage from './Pages/BookListPage';
import EditBooklistPage from './Pages/EditBooklistPage';

// Result Pages
import CourseManagementPage from './Pages/ResultPage/CourseManagementPage';
import ClassCourseAssignmentsPage from './Pages/ResultPage/ClassCourseAssignmentsPage';
import CreateResultFormPage from './Pages/ResultPage/CreateResultFormPage';
import EditResultPage from './Pages/ResultPage/EditResultPage';

// Services
import IdleTimerHandler from './Services/IdleTimerHandler';
import RequireAuth from './Services/RequireAuth';
import RequirePrincipalAuth from './Services/RequirePrincipalAuth';
import AuthProvider from './Services/AuthProvider';

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Protected Dashboard Routes
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <IdleTimerHandler />
        <SideBar />
      </RequireAuth>
    ),
    children: [
      // Dashboard Home
      {
        path: '',
        element: <DashboardPage />,
      },

      // User Management
      {
        path: 'users',
        element: (
          <RequireAuth>
            <UseradminPage />
          </RequireAuth>
        ),
      },
      {
        path: 'users/create-user',
        element: (
          <RequirePrincipalAuth>
            <SignupPage />
          </RequirePrincipalAuth>
        ),
      },

      // Forms
      {
        path: 'reservations',
        element: <Reservations />,
      },
      {
        path: 'complaints',
        element: <ComplaintForms />,
      },
      {
        path: 'subscriptions',
        element: <SubscriptionForms />,
      },
      {
        path: 'tickets',
        element: <TicketPage />,
      },

      // Admissions
      {
        path: 'admissions',
        element: <Admissions />,
      },
      {
        path: 'admissions/edit-admission/:id',
        element: <AdmissionReview />,
      },

      // Job Postings
      {
        path: 'jobpost',
        element: <JobpostPage />,
      },
      {
        path: 'jobpost/new',
        element: <Addjobpost />,
      },
      {
        path: 'jobpost/:id/edit',
        element: <JobPostEditPage />,
      },
      {
        path: 'jobapplication',
        element: <Jobapplicationpage />,
      },
      {
        path: 'jobapplication/edit/:id',
        element: <EditJobapplicationpage />,
      },

      // Book Lists
      {
        path: 'booklists',
        element: <BookListPage />,
      },
      {
        path: 'booklists/create-booklist',
        element: <CreateBookListpage />,
      },
      {
        path: 'booklists/edit/:id',
        element: <EditBooklistPage />,
      },
      {
        path: 'booklists/create-student',
        element: (
          <RequirePrincipalAuth>
            <StudentAuthPage />
          </RequirePrincipalAuth>
        ),
      },

      // Results Management
      {
        path: 'results-management/create-result/',
        element: (
          <RequirePrincipalAuth>
            <CreateResultFormPage />
          </RequirePrincipalAuth>
        ),
      },
      
      {
        path: 'results-management/',
        element: (
          <RequireAuth>
            <EditResultPage />
          </RequireAuth>
        ),
      },
      {
        path: 'results-management/edit-result/:id',
        element: (
          <RequireAuth>
            <ResultEditView />
          </RequireAuth>
        ),
      },
      {
        path: 'course-management',
        element: (
          <RequireAuth>
            <ClassCourseAssignmentsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'course-management/create-course',
        element: (
          <RequireAuth>
            <CourseManagementPage />
          </RequireAuth>
        ),
      },

      // Edit Forms
      {
        path: 'reservations/edit/:id',
        element: <EditReservation />,
      },
      {
        path: 'tickets/edit/:id',
        element: <TicketEditpage />,
      },
      {
        path: 'complaints/edit/:id',
        element: <EditComplain />,
      },
    ],
  },

  
 
  
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);