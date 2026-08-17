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

const chance = new Chance();

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
     // Lưu thông tin người dùng vào localStorage
     localStorage.setItem('user', JSON.stringify(user)); // Lưu thông tin người dùng vào localStorage
    //  localStorage.setItem('remainingTime', remainingTime);
    //compare login user email with examinee code (aka last user email)
    if(localStorage.getItem('examinee')){
      let cur_user = JSON.parse(localStorage.getItem('user'))
      let last_user = JSON.parse(localStorage.getItem('examinee'))
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
    // nếu request lỗi, vì local state luôn phải được xoá dù server có phản hồi hay không.
    axios.post('/api/auth/logout').catch(() => {});
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
