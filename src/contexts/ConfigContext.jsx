import PropTypes from 'prop-types';
import { createContext, useEffect } from 'react';

// project import
import config, { ThemeMode } from 'config';
import useLocalStorage from 'hooks/useLocalStorage';

// Khoá riêng (KHÔNG chung với 'mantis-react-js-config') chỉ đánh dấu việc người dùng đã từng tự
// bấm nút chuyển sáng/tối — tách riêng để không bị lẫn với các cấu hình khác (presetColor, i18n,
// miniDrawer...) vốn lưu chung 1 blob. Chưa có khoá này = coi như chưa override, tiếp tục theo
// prefers-color-scheme của trình duyệt theo thời gian thực.
const MODE_OVERRIDE_KEY = 'theme_mode_override';

// initial state
const initialState = {
  ...config,
  onChangeContainer: () => {},
  onChangeLocalization: () => {},
  onChangeMode: () => {},
  onChangeModeManual: () => {},
  onChangePresetColor: () => {},
  onChangeDirection: () => {},
  onChangeMiniDrawer: () => {},
  onChangeMenuOrientation: () => {},
  onChangeFontFamily: () => {}
};

// ==============================|| CONFIG CONTEXT & PROVIDER ||============================== //

const ConfigContext = createContext(initialState);

function ConfigProvider({ children }) {
  const [config, setConfig] = useLocalStorage('mantis-react-js-config', initialState);

  const onChangeContainer = () => {
    setConfig({
      ...config,
      container: !config.container
    });
  };

  const onChangeLocalization = (lang) => {
    setConfig({
      ...config,
      i18n: lang
    });
  };

  const onChangeMode = (mode) => {
    setConfig({
      ...config,
      mode
    });
  };

  // Nút chuyển tay gọi hàm này (thay vì onChangeMode thẳng) để vừa đổi mode vừa ghim lựa chọn lại
  // — từ đây ngừng tự theo hệ thống (xem effect bên dưới).
  const onChangeModeManual = (mode) => {
    try {
      localStorage.setItem(MODE_OVERRIDE_KEY, mode);
    } catch {
      // localStorage đầy/bị chặn — vẫn đổi mode cho phiên hiện tại, chỉ là không ghim được
    }
    onChangeMode(mode);
  };

  // Mặc định theo prefers-color-scheme của trình duyệt, tự cập nhật real-time nếu hệ thống đổi
  // theme — chỉ áp dụng khi CHƯA từng bấm nút chuyển tay (xem MODE_OVERRIDE_KEY).
  useEffect(() => {
    let stored;
    try {
      stored = localStorage.getItem(MODE_OVERRIDE_KEY);
    } catch {
      stored = null;
    }
    if (stored) {
      if (stored !== config.mode) onChangeMode(stored);
      return;
    }

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const apply = (isDark) => onChangeMode(isDark ? ThemeMode.DARK : ThemeMode.LIGHT);
    apply(media.matches);
    const onSystemChange = (e) => apply(e.matches);
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangePresetColor = (theme) => {
    setConfig({
      ...config,
      presetColor: theme
    });
  };

  const onChangeDirection = (direction) => {
    setConfig({
      ...config,
      themeDirection: direction
    });
  };

  const onChangeMiniDrawer = (miniDrawer) => {
    setConfig({
      ...config,
      miniDrawer
    });
  };

  const onChangeMenuOrientation = (layout) => {
    setConfig({
      ...config,
      menuOrientation: layout
    });
  };

  const onChangeFontFamily = (fontFamily) => {
    setConfig({
      ...config,
      fontFamily
    });
  };

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        onChangeContainer,
        onChangeLocalization,
        onChangeMode,
        onChangeModeManual,
        onChangePresetColor,
        onChangeDirection,
        onChangeMiniDrawer,
        onChangeMenuOrientation,
        onChangeFontFamily
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

ConfigProvider.propTypes = {
  children: PropTypes.node
};

export { ConfigProvider, ConfigContext };
