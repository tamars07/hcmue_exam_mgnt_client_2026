import PropTypes from 'prop-types';
import { createContext, useEffect, useReducer } from 'react';

// third-party
import jwtDecode from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'contexts/auth-reducer/actions';
import authReducer from 'contexts/auth-reducer/auth';

// project import
import Loader from 'components/Loader';
import axios from 'utils/axiosSystem';

// constant
const initialState = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

const verifyToken = (serviceToken) => {
  if (!serviceToken) {
    return false;
  }
  const decoded = jwtDecode(serviceToken);
  return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken) => {
  if (serviceToken) {
    localStorage.setItem('superAdminToken', serviceToken);
  } else {
    localStorage.removeItem('superAdminToken');
  }
};

// ==============================|| SUPER ADMIN CONTEXT & PROVIDER ||============================== //

const SuperAdminContext = createContext(null);

export const SuperAdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('superAdminToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);
          const response = await axios.get('api/system/auth/me');
          const user = response.data.data;
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user
            }
          });
        } else {
          dispatch({ type: LOGOUT });
        }
      } catch (err) {
        console.error(err);
        dispatch({ type: LOGOUT });
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post('api/system/auth/login', { email, password });
    const { serviceToken, user } = response.data.data;
    setSession(serviceToken);
    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });
  };

  const logout = () => {
    // Ghi lại thời điểm đăng xuất (system_activity_logs) trước khi xoá phiên — phải tự chỉ định
    // header Authorization tường minh vì request được gửi bất đồng bộ, đến lúc interceptor đọc thì
    // superAdminToken có thể đã bị setSession(null) xoá mất.
    const serviceToken = localStorage.getItem('superAdminToken');
    if (serviceToken) {
      axios.post('api/system/auth/logout', {}, { headers: { Authorization: `Bearer ${serviceToken}` } }).catch(() => {});
    }
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <SuperAdminContext.Provider value={{ ...state, login, logout }}>{children}</SuperAdminContext.Provider>;
};

SuperAdminProvider.propTypes = {
  children: PropTypes.node
};

export default SuperAdminContext;
