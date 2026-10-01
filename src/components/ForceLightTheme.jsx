import PropTypes from 'prop-types';
import { useMemo } from 'react';

// material-ui
import { ThemeProvider, createTheme } from '@mui/material/styles';

// project import
import useConfig from 'hooks/useConfig';
import Palette from 'themes/palette';
import Typography from 'themes/typography';
import CustomShadows from 'themes/shadows';
import componentsOverride from 'themes/overrides';
import { ThemeMode } from 'config';

// ==============================|| FORCE LIGHT THEME ||============================== //
// Ép giao diện SÁNG bất kể app đang ở chế độ tối (mode trong ConfigContext) — dùng cho trang đăng
// nhập (layout/Auth): không đặt nút chuyển sáng/tối ở đây, và luôn hiển thị sáng dù trước đó
// người dùng đã chọn tối ở màn hình khác (giữ ấn tượng thương hiệu nhất quán trước khi đăng nhập).
// Giữ nguyên presetColor/themeDirection/fontFamily hiện tại — chỉ ép riêng trục sáng/tối.

export default function ForceLightTheme({ children }) {
  const { themeDirection, presetColor, fontFamily } = useConfig();

  const theme = useMemo(() => Palette(ThemeMode.LIGHT, presetColor), [presetColor]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const themeTypography = useMemo(() => Typography(fontFamily), [fontFamily]);
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: { xs: 0, sm: 768, md: 1024, lg: 1266, xl: 1440 }
      },
      direction: themeDirection,
      mixins: { toolbar: { minHeight: 60, paddingTop: 8, paddingBottom: 8 } },
      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography
    }),
    [themeDirection, theme, themeTypography, themeCustomShadows]
  );

  const lightTheme = createTheme(themeOptions);
  lightTheme.components = componentsOverride(lightTheme);

  return <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>;
}

ForceLightTheme.propTypes = {
  children: PropTypes.node
};
