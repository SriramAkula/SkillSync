import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ShellLayout } from '../layout/ShellLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { OtpVerifyPage } from '../features/auth/pages/OtpVerifyPage';
import { RegisterDetailsPage } from '../features/auth/pages/RegisterDetailsPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { MentorListPage } from '../features/mentors/pages/MentorListPage';
import { MentorDetailPage } from '../features/mentors/pages/MentorDetailPage';
import { ApplyMentorPage } from '../features/mentors/pages/ApplyMentorPage';
import { MySessionsPage } from '../features/sessions/pages/MySessionsPage';
import { RequestSessionPage } from '../features/sessions/pages/RequestSessionPage';
import { SessionDetailPage } from '../features/sessions/pages/SessionDetailPage';
import { MentorSessionsPage } from '../features/sessions/pages/MentorSessionsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { EditProfilePage } from '../features/profile/pages/EditProfilePage';
import { NotificationListPage } from '../features/notifications/pages/NotificationListPage';
import { MentorReviewsPage } from '../features/reviews/pages/MentorReviewsPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { UserDetailsPage } from '../features/admin/pages/UserDetailsPage';
import { PendingMentorsPage } from '../features/admin/pages/PendingMentorsPage';
import { SkillListPage } from '../features/skills/pages/SkillListPage';
import { GroupListPage } from '../features/groups/pages/GroupListPage';
import { GroupDetailPage } from '../features/groups/pages/GroupDetailPage';
import { HomePage } from '../features/public/pages/HomePage';

// Lazy loading placeholders
const UnauthorizedPage = () => <div>Unauthorized</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/auth',
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'verify-otp', element: <OtpVerifyPage /> },
      { path: 'register-details', element: <RegisterDetailsPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ]
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Validates auth
    children: [
      {
        element: <ShellLayout />,
        children: [
          { path: 'mentors', element: <MentorListPage /> },
          { path: 'mentors/apply', element: <ApplyMentorPage /> },
          { path: 'mentors/:id', element: <MentorDetailPage /> },
          { path: 'sessions', element: <MySessionsPage /> },
          { path: 'sessions/request', element: <RequestSessionPage /> },
          { path: 'sessions/:id', element: <SessionDetailPage /> },
          { path: 'skills', element: <SkillListPage /> },
          { path: 'groups', element: <GroupListPage /> },
          { path: 'groups/:id', element: <GroupDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/edit', element: <EditProfilePage /> },
          { path: 'notifications', element: <NotificationListPage /> },
          { path: 'reviews/mentor/:mentorId', element: <MentorReviewsPage /> },
          {
            path: 'mentor-dashboard',
            element: <ProtectedRoute allowedRoles={['ROLE_MENTOR']} />,
            children: [{ path: '', element: <MentorSessionsPage /> }]
          },
          {
            path: 'admin',
            element: <ProtectedRoute allowedRoles={['ROLE_ADMIN']} />,
            children: [
              { path: '', element: <PendingMentorsPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'users/:id', element: <UserDetailsPage /> },
              { path: 'skills', element: <SkillListPage /> }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/mentors" replace />
  }
]);
