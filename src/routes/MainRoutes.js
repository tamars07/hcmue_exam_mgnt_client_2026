import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import PagesLayout from 'layout/Pages';
import SimpleLayout from 'layout/Simple';
import { SimpleLayoutType } from 'config';
import ChairmanGuard from 'utils/route-guard/ChairmanGuard';
import GradingAdminGuard from 'utils/route-guard/GradingAdminGuard';
import ExaminerGuard from 'utils/route-guard/ExaminerGuard';

const MaintenanceError = Loadable(lazy(() => import('pages/maintenance/404')));
const MaintenanceError500 = Loadable(lazy(() => import('pages/maintenance/500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('pages/maintenance/under-construction')));
const MaintenanceComingSoon = Loadable(lazy(() => import('pages/maintenance/coming-soon')));

const AppContactUS = Loadable(lazy(() => import('pages/contact-us')));

// render - council management
const OrganizationsPage = Loadable(lazy(() => import('pages/council-mgmt/organizations')));
const RoomsPage = Loadable(lazy(() => import('pages/council-mgmt/rooms')));
const CouncilsPage = Loadable(lazy(() => import('pages/council-mgmt/councils')));
const CouncilTurnsPage = Loadable(lazy(() => import('pages/council-mgmt/councils/turns')));
const ExamineesPage = Loadable(lazy(() => import('pages/council-mgmt/examinees')));
const MonitorsPage = Loadable(lazy(() => import('pages/council-mgmt/monitors')));
const ActivityLogsPage = Loadable(lazy(() => import('pages/council-mgmt/logs')));

// render - chairman (điểm trưởng)
const ChairmanDashboardPage = Loadable(lazy(() => import('pages/chairman/dashboard')));
const ChairmanTestImportPage = Loadable(lazy(() => import('pages/chairman/test-import')));
const ChairmanRoomsPage = Loadable(lazy(() => import('pages/chairman')));
const ChairmanExamineesPage = Loadable(lazy(() => import('pages/chairman/examinees')));
const ChairmanLogsPage = Loadable(lazy(() => import('pages/chairman/logs')));

// render - grading (chấm thi, B1-B8)
const GradingImportDataPage = Loadable(lazy(() => import('pages/grading/import-data')));
const GradingAnswerKeysPage = Loadable(lazy(() => import('pages/grading/answer-keys')));
const GradingAutoMarkingPage = Loadable(lazy(() => import('pages/grading/auto-marking')));
const GradingExaminersPage = Loadable(lazy(() => import('pages/grading/examiners')));
const GradingExaminerPairsPage = Loadable(lazy(() => import('pages/grading/examiner-pairs')));
const GradingAssignmentsPage = Loadable(lazy(() => import('pages/grading/assignments')));
const GradingDeviationsPage = Loadable(lazy(() => import('pages/grading/deviations')));
const GradingResultsPage = Loadable(lazy(() => import('pages/grading/results')));
const GradingWorkspacePage = Loadable(lazy(() => import('pages/grading/workspace')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          path: 'council-mgmt/organizations',
          element: <OrganizationsPage />
        },
        {
          path: 'council-mgmt/rooms',
          element: <RoomsPage />
        },
        {
          path: 'council-mgmt/councils',
          element: <CouncilsPage />
        },
        {
          path: 'council-mgmt/councils/:code/turns',
          element: <CouncilTurnsPage />
        },
        {
          path: 'council-mgmt/examinees',
          element: <ExamineesPage />
        },
        {
          path: 'council-mgmt/monitors',
          element: <MonitorsPage />
        },
        {
          path: 'council-mgmt/logs',
          element: <ActivityLogsPage />
        },
        {
          path: 'chairman/dashboard',
          element: (
            <ChairmanGuard>
              <ChairmanDashboardPage />
            </ChairmanGuard>
          )
        },
        {
          path: 'chairman/test-import',
          element: (
            <ChairmanGuard>
              <ChairmanTestImportPage />
            </ChairmanGuard>
          )
        },
        {
          path: 'chairman/rooms',
          element: (
            <ChairmanGuard>
              <ChairmanRoomsPage />
            </ChairmanGuard>
          )
        },
        {
          path: 'chairman/examinees',
          element: (
            <ChairmanGuard>
              <ChairmanExamineesPage />
            </ChairmanGuard>
          )
        },
        {
          path: 'chairman/logs',
          element: (
            <ChairmanGuard>
              <ChairmanLogsPage />
            </ChairmanGuard>
          )
        },
        {
          path: 'grading/import-data',
          element: (
            <GradingAdminGuard>
              <GradingImportDataPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/answer-keys',
          element: (
            <GradingAdminGuard>
              <GradingAnswerKeysPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/auto-marking',
          element: (
            <GradingAdminGuard>
              <GradingAutoMarkingPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/examiners',
          element: (
            <GradingAdminGuard>
              <GradingExaminersPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/examiner-pairs',
          element: (
            <GradingAdminGuard>
              <GradingExaminerPairsPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/assignments',
          element: (
            <GradingAdminGuard>
              <GradingAssignmentsPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/deviations',
          element: (
            <GradingAdminGuard>
              <GradingDeviationsPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/results',
          element: (
            <GradingAdminGuard>
              <GradingResultsPage />
            </GradingAdminGuard>
          )
        },
        {
          path: 'grading/workspace',
          element: (
            <ExaminerGuard>
              <GradingWorkspacePage />
            </ExaminerGuard>
          )
        }
      ]
    },
    {
      path: '/',
      element: <SimpleLayout layout={SimpleLayoutType.SIMPLE} />,
      children: [
        {
          path: 'contact-us',
          element: <AppContactUS />
        }
      ]
    },
    {
      path: '/',
      element: <PagesLayout />,
      children: [
        {
          path: '404',
          element: <MaintenanceError />
        },
        {
          path: '500',
          element: <MaintenanceError500 />
        },
        {
          path: 'under-construction',
          element: <MaintenanceUnderConstruction />
        },
        {
          path: 'coming-soon',
          element: <MaintenanceComingSoon />
        }
      ]
    }
  ]
};

export default MainRoutes;
