import PropTypes from 'prop-types';

// material-ui
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

// project import
import useConfig from 'hooks/useConfig';
import { ThemeMode } from 'config';

// ==============================|| HEADER CONTENT - COLOR MODE TOGGLE ||============================== //
// `sx` cho phép nơi gọi tự chỉnh màu icon cho hợp nền header riêng (vd layout/System dùng AppBar nền
// xanh cố định #0056b3, cần icon trắng thay vì mặc định text.primary).

export default function ColorModeToggle({ sx }) {
  const { mode, onChangeModeManual } = useConfig();
  const isDark = mode === ThemeMode.DARK;

  return (
    <Tooltip title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
      <IconButton onClick={() => onChangeModeManual(isDark ? ThemeMode.LIGHT : ThemeMode.DARK)} sx={sx ?? { color: 'text.primary' }}>
        {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

ColorModeToggle.propTypes = {
  sx: PropTypes.object
};
