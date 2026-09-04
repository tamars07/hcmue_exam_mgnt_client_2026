/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';
import { createContext, useEffect, useReducer } from 'react';

// third-party
import { Chance } from 'chance';
import jwtDecode from 'jwt-decode';

// reducer - state management
import { LOGIN, LOGOUT } from 'contexts/auth-reducer/actions';
import authReducer from 'contexts/auth-reducer/auth';

// project import
import Loader from 'components/Loader';
import axios from 'utils/axios';
import safeJsonParse from 'utils/safeJsonParse';

const chance = new Chance();

// Vai trò được phép dùng app này (Tổ chức thi / Quản lý Kì thi) — Cán bộ coi thi (MONITOR) và Thí
// sinh (EXAMINEE) đăng nhập cùng endpoint /api/auth/login (dùng chung cho cả hệ thống coi thi
// hcmue_client_2026) nhưng không có màn hình nào ở app này dành cho họ, nên chặn ngay ở đây thay vì
// để họ vào rồi mới gặp lỗi 403 rời rạc từng API.
const ALLOWED_ROLES = ['ADMIN', 'MODERATOR', 'CHAIRMAN'];
const WRONG_ACCOUNT_TYPE_HINTS = {
  MONITOR: 'Đây là tài khoản Cán bộ coi thi — vui lòng đăng nhập ở hệ thống coi thi.',
  EXAMINEE: 'Đây là tài khoản Thí sinh — vui lòng đăng nhập ở hệ thống làm bài thi.'
};

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
  /**
   * Property 'exp' does not exist on type '<T = unknown>(token: string, options?: JwtDecodeOptions | undefined) => T'.
   */
  // console.log(serviceToken)
  // console.log(decoded.exp)
  // console.log(Date.now())
  return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

const exportLocalStorageToTxt = () => {
    let data = "";

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);

        data += key + " = " + value + "\n";
    }

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "localStorage_backup.txt";
    a.click();

    URL.revokeObjectURL(url);
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext(null);

export const JWTProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);
          const response = await axios.get('/api/auth/me');
          const user = response.data.data;
          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user
            }
          });
        } else {
          dispatch({
            type: LOGOUT
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: LOGOUT
        });
      }
    };

    init();
  }, []);

  const login = async (email, password) => {
    // const response = await axios.post('/api/account/login', { email, password });
    const response = await axios.post('/api/auth/login', { email, password });
    const { serviceToken, user } = response.data.data;

    const roles = user?.roles || [];
    if (!roles.some((r) => ALLOWED_ROLES.includes(r))) {
      const hint = roles.map((r) => WRONG_ACCOUNT_TYPE_HINTS[r]).find(Boolean) || '';
      const error = new Error('ACCOUNT_NOT_ALLOWED');
      error.error_code = 'ACCOUNT_NOT_ALLOWED';
      error.error = `Tài khoản này không có quyền truy cập hệ thống Tổ chức thi / Quản lý Kì thi.${hint ? ' ' + hint : ''}`;
      throw error;
    }

     // Lưu thông tin người dùng vào localStorage
     localStorage.setItem('user', JSON.stringify(user)); // Lưu thông tin người dùng vào localStorage
    //  localStorage.setItem('remainingTime', remainingTime);
    //compare login user email with examinee code (aka last user email)
    if(localStorage.getItem('examinee')){
      let cur_user = safeJsonParse(localStorage.getItem('user'), {})
      let last_user = safeJsonParse(localStorage.getItem('examinee'), {})
      if(cur_user.id != last_user.user_id){
        localStorage.removeItem('examinee');
        localStorage.removeItem('answers');
        localStorage.removeItem('remainingTime');
        localStorage.removeItem('testdata');
      }
    }
    setSession(serviceToken);
    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });
  };

  const register = async (email, password, firstName, lastName) => {
    // todo: this flow need to be recode as it not verified
    const id = chance.bb_pin();
    const response = await axios.post('/api/account/register', {
      id,
      email,
      password,
      firstName,
      lastName
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers),
        {
          id,
          email,
          password,
          name: `${firstName} ${lastName}`
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const logout = () => {
    // Ghi lại thời điểm đăng xuất ở server (ActivityLog {ROLE}_LOGOUT) — không chặn luồng đăng xuất
    // nếu request lỗi, vì local state luôn phải được xoá dù server có phản hồi hay không. Phải tự
    // chỉ định header Authorization tường minh (không dựa vào interceptor đọc localStorage) vì
    // request được gửi bất đồng bộ — đến lúc interceptor thực sự đọc thì serviceToken đã bị
    // setSession(null)/localStorage.clear() xoá mất, khiến request đi mà không có token.
    const serviceToken = localStorage.getItem('serviceToken');
    if (serviceToken) {
      axios.post('/api/auth/logout', {}, { headers: { Authorization: `Bearer ${serviceToken}` } }).catch(() => {});
    }
    setSession(null);
    // localStorage.removeItem('remainingTime');
    // localStorage.removeItem('testdata');
    // exportLocalStorageToTxt();
    // localStorage.removeItem('user');
    // localStorage.removeItem('answers');
    // localStorage.removeItem('examinee');
    // 🔥 xoá toàn bộ localStorage
    localStorage.clear();
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async () => {};

  const updateProfile = () => {};

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <JWTContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext.Provider>;
};

JWTProvider.propTypes = {
  children: PropTypes.node
};

export default JWTContext;
