/* eslint-disable no-unused-vars */
import { Link } from 'react-router-dom';

// material-ui
import { Grid, Stack, Typography } from '@mui/material';

// project import
import useAuth from 'hooks/useAuth';
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/auth-forms/AuthLogin';
// import DemoPage from 'sections/auth/auth-forms/DemoPage';

// assets
import Logo from 'assets/images/hcmue/logo_hcmue.png';

// ================================|| LOGIN ||================================ //

const Login = () => {
  const { isLoggedIn } = useAuth();

  return (
    <AuthWrapper>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Stack direction="column" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3" align="center">
              Hệ thống Tổ chức thi HCMUE
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Đăng nhập dành cho Admin / Điểm trưởng
            </Typography>
            <img src={Logo} alt="Logo HCMUE" style={{ marginTop: 16, maxWidth: '200px' }} />
            <Typography
              component={Link}
              to={isLoggedIn ? '/auth/register' : '/register'}
              variant="body1"
              sx={{ textDecoration: 'none' }}
              color="primary"
              hidden
            >
              Don&apos;t have an account?
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <AuthLogin isDemo={isLoggedIn} />
          {/* <DemoPage/> */}
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" align="center" color="text.secondary">
            Bạn là Super Admin cấu hình cơ sở dữ liệu?{' '}
            <Link to="/system/login" style={{ fontWeight: 600 }}>
              Đăng nhập tại đây
            </Link>
          </Typography>
        </Grid>
      </Grid>
    </AuthWrapper>
  );
};

export default Login;
