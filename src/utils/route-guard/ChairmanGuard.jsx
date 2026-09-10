import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import useAuth from 'hooks/useAuth';
import { openSnackbar } from 'api/snackbar';

// ==============================|| CHAIRMAN GUARD ||============================== //
// Điểm trưởng đăng nhập cùng hệ thống với admin council-mgmt (chung JWTContext, khác role) — không
// cần guard/token riêng như Super Admin, chỉ cần thêm kiểm tra role sau khi AuthGuard đã xác nhận
// đăng nhập.

const ChairmanGuard = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isChairman = user?.roles?.includes('CHAIRMAN') || user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }
    if (user && !isChairman) {
      openSnackbar({
        open: true,
        message: 'Bạn không có quyền truy cập khu vực điểm trưởng',
        variant: 'alert',
        alert: { color: 'error' }
      });
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, user, isChairman, navigate, location]);

  if (!isLoggedIn || !isChairman) {
    return null;
  }

  return children;
};

ChairmanGuard.propTypes = {
  children: PropTypes.node
};

export default ChairmanGuard;
