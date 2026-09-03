import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// project import
import { APP_DEFAULT_PATH } from 'config';
import useAuth from 'hooks/useAuth';

// ==============================|| GUEST GUARD ||============================== //

const GuestGuard = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn) {
      // Điểm trưởng (không kiêm ADMIN) vào thẳng màn hình Giám sát kì thi thay vì dashboard chung.
      const isChairmanOnly = user?.roles?.includes('CHAIRMAN') && !user?.roles?.includes('ADMIN');
      // Giám khảo (không kiêm ADMIN) vào thẳng trang chấm thi, không thấy dashboard/menu quản trị.
      const isExaminerOnly = user?.roles?.includes('EXAMINER') && !user?.roles?.includes('ADMIN');
      const defaultPath = isChairmanOnly ? '/chairman/examinees' : isExaminerOnly ? '/grading/workspace' : APP_DEFAULT_PATH;

      navigate(location?.state?.from ? location?.state?.from : defaultPath, {
        state: {
          from: ''
        },
        replace: true
      });
    }
  }, [isLoggedIn, user, navigate, location]);

  return children;
};

GuestGuard.propTypes = {
  children: PropTypes.node
};

export default GuestGuard;
