// material-ui
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

// project import
import useConfig from 'hooks/useConfig';
import { ThemeMode } from 'config';

// ==============================|| HEADER CONTENT - COLOR MODE TOGGLE ||============================== //

export default function ColorModeToggle() {
  const { mode, onChangeModeManual } = useConfig();
  const isDark = mode === ThemeMode.DARK;

  return (
    <Tooltip title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}>
      <IconButton
        color="secondary"
        onClick={() => onChangeModeManual(isDark ? ThemeMode.LIGHT : ThemeMode.DARK)}
        sx={{ color: 'text.primary' }}
      >
        {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
