// material-ui
import { Container, Stack, Typography, useMediaQuery } from '@mui/material';

// ==============================|| FOOTER - AUTHENTICATION ||============================== //

const AuthFooter = () => {
  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="xl">
      <Stack
        direction={matchDownSM ? 'column' : 'row'}
        justifyContent={matchDownSM ? 'center' : 'space-between'}
        spacing={2}
        textAlign={matchDownSM ? 'center' : 'inherit'}
      >
        <Typography variant="subtitle2" color="secondary" component="span">
          Bản quyền thuộc {' '}
          <Typography component="span" variant="subtitle2">
            {/* Trường Đại học Sư phạm Thành phố Hồ Chí Minh - 2025 &#169; - v.2025.05.15 */}
            HCMUE &#169; v.2026.06.09
          </Typography>
        </Typography>

        <Stack direction={matchDownSM ? 'column' : 'row'} spacing={matchDownSM ? 1 : 3} textAlign={matchDownSM ? 'center' : 'inherit'}>
          {/*<Typography
            variant="subtitle2"
            color="secondary"
            component={Link}
            href="https://hcmue.edu.vn/vi/"
            target="_blank"
            underline="hover"
          >
            Trường Đại học Sư phạm Thành phố Hồ Chí Minh &#169;
          </Typography>*/}
        </Stack>
      </Stack>
    </Container>
  );
};

export default AuthFooter;
