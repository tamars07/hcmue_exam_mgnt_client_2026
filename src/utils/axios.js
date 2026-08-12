import axios from 'axios';

const axiosServices = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/' });

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosServices.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('serviceToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// axiosServices.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response.status === 401 && !window.location.href.includes('/login')) {
//        window.location = '/login';
//     }
//     return Promise.reject((error.response && error.response.data) || 'Wrong Services');
//   }
// );

axiosServices.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !window.location.href.includes('/login')) {
      window.location = '/login';
    }

    return Promise.reject((error.response && error.response.data) || {
      success: false,
      message: 'Không kết nối được máy chủ'
    });
  }
);

export default axiosServices;

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.get(url, { ...config });

  return res.data;
};

export const fetcherPost = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.post(url, { ...config });

  return res.data;
};
