import PropTypes from 'prop-types';

// material-ui
import { Stack, Typography } from '@mui/material';

// assets
import hcmueLogo from 'assets/images/hcmue-logo.png';

// ==============================|| LOGO ||============================== //

const LogoMain = ({ reverse }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <img src={hcmueLogo} alt="HCMUE" style={{ height: 36, display: 'block' }} />
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        lineHeight: 1.2,
        color: reverse ? 'common.white' : 'text.primary',
        whiteSpace: 'normal'
      }}
    >
      Hệ thống Tổ chức thi HCMUE
    </Typography>
  </Stack>
);

LogoMain.propTypes = {
  reverse: PropTypes.bool
};

export default LogoMain;
