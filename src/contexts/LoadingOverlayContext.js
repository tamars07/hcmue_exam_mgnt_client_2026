import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo, useState } from 'react';

// ==============================|| LOADING OVERLAY CONTEXT & PROVIDER ||============================== //
// Overlay toàn màn hình dùng cho các thao tác cần người dùng CHỜ và KHÔNG rời trang giữa chừng
// (submit form, xoá, import, tải file, thao tác DB...). Khác với Snackbar (api/snackbar.js) vốn chỉ
// báo kết quả SAU khi xong — overlay này hiện NGAY LÚC ĐANG XỬ LÝ.

const LoadingOverlayContext = createContext(null);

export const LoadingOverlayProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, message: '' });

  const showLoading = useCallback((message) => {
    setState({ open: true, message: message || 'Đang thực hiện thao tác... Vui lòng chờ' });
  }, []);

  const hideLoading = useCallback(() => {
    setState({ open: false, message: '' });
  }, []);

  // Bọc quanh 1 thao tác bất đồng bộ: hiện overlay lúc bắt đầu, tự tắt khi xong (kể cả khi lỗi).
  const withLoading = useCallback(
    async (task, message) => {
      showLoading(message);
      try {
        return await task();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  const value = useMemo(
    () => ({ open: state.open, message: state.message, showLoading, hideLoading, withLoading }),
    [state, showLoading, hideLoading, withLoading]
  );

  return <LoadingOverlayContext.Provider value={value}>{children}</LoadingOverlayContext.Provider>;
};

LoadingOverlayProvider.propTypes = {
  children: PropTypes.node
};

export default LoadingOverlayContext;
