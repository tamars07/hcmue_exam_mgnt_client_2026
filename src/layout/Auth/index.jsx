import { Outlet } from 'react-router-dom';

// project import
import GuestGuard from 'utils/route-guard/GuestGuard';
import ForceLightTheme from 'components/ForceLightTheme';

// ==============================|| LAYOUT - AUTH ||============================== //

const AuthLayout = () => (
  <ForceLightTheme>
    <GuestGuard>
      <Outlet />
    </GuestGuard>
  </ForceLightTheme>
);

export default AuthLayout;
