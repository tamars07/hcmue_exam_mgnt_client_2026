import { Link } from 'react-router-dom';
import { Grid, Stack, Typography } from '@mui/material';

// project import
import AuthWrapper from 'sections/auth/AuthWrapper';
import SuperAdminLogin from 'sections/auth/auth-forms/SuperAdminLogin';

// assets
import Logo from 'assets/images/hcmue/logo_hcmue.png';

// ================================|| SUPER ADMIN - LOGIN ||================================ //

const SystemLoginPage = () => (
  <AuthWrapper>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack direction="column" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
          <Typography variant="h3" align="center">
            Quản trị hệ thống
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Đăng nhập Super Admin để cấu hình cơ sở dữ liệu kỳ thi
          </Typography>
          <img src={Logo} alt="Logo HCMUE" style={{ marginTop: 16, maxWidth: '200px' }} />
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <SuperAdminLogin />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body2" align="center" color="text.secondary">
          Bạn là Admin / Điểm trưởng quản lý kỳ thi?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Đăng nhập tại đây
          </Link>
        </Typography>
      </Grid>
    </Grid>
  </AuthWrapper>
);

export default SystemLoginPage;
