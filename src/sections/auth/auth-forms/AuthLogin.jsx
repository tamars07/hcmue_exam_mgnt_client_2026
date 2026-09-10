import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import {
  Button,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
// import { preload } from 'swr';

// project import
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
// import { fetcher } from 'utils/axios';

// assets
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

// ============================|| JWT - LOGIN ||============================ //

const AuthLogin = () => {
  const { login } = useAuth();
  const scriptedRef = useScriptRef();

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const [state, setState] = React.useState({
    open: false,
    vertical: 'top',
    horizontal: 'center',
    message: '',
    type: 'warning',
    persist: false
  });
  const { vertical, horizontal, open, message, type, persist } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

  return (
    <>
      <Formik
        initialValues={{
          email: '',
          password: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().max(255).required('Chưa nhập tài khoản'),
          password: Yup.string().max(255).required('Chưa nhập mật khẩu')
        })}
        onSubmit={async (values, { setStatus, setSubmitting }) => {
          try {
            await login(values.email, values.password);
            if (scriptedRef.current) {
              setStatus({ success: true });
              setSubmitting(true);
            //   preload('api/menu/dashboard', fetcher); // load menu on login success
            }
          } catch (err) {
            console.error(err);
            const persist = err?.error_code === 'WRONG_ACTIVE_DB' || err?.error_code === 'ACCOUNT_NOT_ALLOWED';
            setState({
              open: true,
              vertical: 'bottom',
              horizontal: 'center',
              type: 'error',
              message: err?.error || err?.message || 'Đăng nhập thất bại',
              persist
            });
            if (scriptedRef.current) {
              setStatus({ success: false });
              //setErrors({ submit: err.message });
              setSubmitting(false);
            }
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
          {/* <form noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(e)}}> */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="email-login">Tên tài khoản</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="email"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Nhập tài khoản"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="standard-weight-helper-text-email-login">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="password-login">Mật khẩu</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Nhập mật khẩu"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sx={{ mt:1 }}>
                <AnimateButton>
                  <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained"  sx={{
                    backgroundColor: '#0056b3',  // Mã màu xanh biển đậm
                    '&:hover': {
                      backgroundColor: '#1e56a0'  // Màu xanh biển đậm hơn khi hover
                    }
                  }}>
                    Đăng nhập
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        autoHideDuration={persist ? null : 5000}
        open={open}
        onClose={handleClose}
        key={vertical + horizontal}
      >
        <Alert
          onClose={handleClose}
          severity={type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          { message }
        </Alert>
      </Snackbar>
    </>
  );
};

AuthLogin.propTypes = {
  isDemo: PropTypes.bool
};

export default AuthLogin;
