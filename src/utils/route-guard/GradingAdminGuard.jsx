import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import useAuth from 'hooks/useAuth';
import { openSnackbar } from 'api/snackbar';

// ==============================|| GRADING ADMIN GUARD ||============================== //
// Khu vực quản trị chấm thi (B1-B8) — ADMIN/MODERATOR/CHAIRMAN, KHÔNG cho EXAMINER vào (giám khảo
// chỉ có trang workspace riêng, xem ExaminerGuard).

const GradingAdminGuard = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isGradingAdmin = ['ADMIN', 'MODERATOR', 'CHAIRMAN'].some((role) => user?.roles?.includes(role));

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }
    if (user && !isGradingAdmin) {
      openSnackbar({
        open: true,
        message: 'Bạn không có quyền truy cập khu vực chấm thi',
        variant: 'alert',
        alert: { color: 'error' }
      });
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, user, isGradingAdmin, navigate, location]);

  if (!isLoggedIn || !isGradingAdmin) {
    return null;
  }

  return children;
};

GradingAdminGuard.propTypes = {
  children: PropTypes.node
};

export default GradingAdminGuard;
