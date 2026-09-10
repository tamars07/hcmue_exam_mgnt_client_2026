import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import useSuperAdmin from 'hooks/useSuperAdmin';

// ==============================|| SUPER ADMIN GUARD ||============================== //

const SuperAdminGuard = ({ children }) => {
  const { isLoggedIn } = useSuperAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/system/login', {
        state: {
          from: location.pathname
        },
        replace: true
      });
    }
  }, [isLoggedIn, navigate, location]);

  return children;
};

SuperAdminGuard.propTypes = {
  children: PropTypes.node
};

export default SuperAdminGuard;
