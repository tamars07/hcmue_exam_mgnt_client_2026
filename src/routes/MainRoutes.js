import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import PagesLayout from 'layout/Pages';
import SimpleLayout from 'layout/Simple';
import { SimpleLayoutType } from 'config';

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
