import axios from 'axios';

// Instance riêng cho khu vực Super Admin (chọn/tạo/backup DB kỳ thi) — tách hẳn khỏi instance
// `utils/axios` đang dùng key `serviceToken` cho đăng nhập council-mgmt, để 2 phiên đăng nhập
// (super admin và admin hội đồng thi) không đè token lên nhau trên cùng 1 trình duyệt.
const axiosSystem = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/' });

axiosSystem.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('superAdminToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosSystem.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !window.location.href.includes('/system/login')) {
      window.location = '/system/login';
    }

    return Promise.reject(
      (error.response && error.response.data) || {
        success: false,
        message: 'Không kết nối được máy chủ'
      }
    );
  }
);

export default axiosSystem;
