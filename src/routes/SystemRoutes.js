import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import SystemLayout from 'layout/System';
import SuperAdminGuard from 'utils/route-guard/SuperAdminGuard';
import SuperAdminGuestGuard from 'utils/route-guard/SuperAdminGuestGuard';

const SystemLogin = Loadable(lazy(() => import('pages/system/login')));
const ExamDatabasesPage = Loadable(lazy(() => import('pages/system/exam-databases')));

// ==============================|| SUPER ADMIN ROUTING ||============================== //
// Không tái dùng AuthLayout/GuestGuard hiện có — GuestGuard đọc trạng thái đăng nhập council-mgmt
// (JWTContext), sẽ đá nhầm 1 admin hội đồng thi đang đăng nhập sẵn ra khỏi trang login super admin.

const SystemRoutes = {
  path: '/system',
  children: [
    {
      path: 'login',
      element: (
        <SuperAdminGuestGuard>
          <SystemLogin />
        </SuperAdminGuestGuard>
      )
    },
    {
      path: '/system',
      element: (
        <SuperAdminGuard>
          <SystemLayout />
        </SuperAdminGuard>
      ),
      children: [
        {
          path: 'exam-databases',
          element: <ExamDatabasesPage />
        }
      ]
    }
  ]
};

export default SystemRoutes;
