import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import useAuth from 'hooks/useAuth';
import { openSnackbar } from 'api/snackbar';

// ==============================|| EXAMINER GUARD ||============================== //
// Trang giám khảo (workspace chấm tự luận) — role EXAMINER, ADMIN vẫn vào được để hỗ trợ/kiểm tra.

const ExaminerGuard = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExaminer = user?.roles?.includes('EXAMINER') || user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }
    if (user && !isExaminer) {
      openSnackbar({
        open: true,
        message: 'Bạn không có quyền truy cập khu vực giám khảo',
        variant: 'alert',
        alert: { color: 'error' }
      });
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, user, isExaminer, navigate, location]);

  if (!isLoggedIn || !isExaminer) {
    return null;
  }

  return children;
};

ExaminerGuard.propTypes = {
  children: PropTypes.node
};

export default ExaminerGuard;
