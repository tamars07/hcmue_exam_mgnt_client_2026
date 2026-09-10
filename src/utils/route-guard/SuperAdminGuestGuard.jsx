import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import useSuperAdmin from 'hooks/useSuperAdmin';

// ==============================|| SUPER ADMIN GUEST GUARD ||============================== //
// Điều hướng khỏi trang login super admin sau khi đăng nhập thành công (login không tự chuyển
// trang — trạng thái isLoggedIn đổi, guard này lắng nghe và điều hướng, giống GuestGuard hiện có
// nhưng đọc trạng thái đăng nhập super admin thay vì council-mgmt).

const SuperAdminGuestGuard = ({ children }) => {
  const { isLoggedIn } = useSuperAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(location?.state?.from ? location?.state?.from : '/system/exam-databases', {
        state: { from: '' },
        replace: true
      });
    }
  }, [isLoggedIn, navigate, location]);

  return children;
};

SuperAdminGuestGuard.propTypes = {
  children: PropTypes.node
};

export default SuperAdminGuestGuard;
