import { Outlet } from 'react-router-dom';

// material-ui
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { LogoutOutlined } from '@ant-design/icons';

// project import
import useSuperAdmin from 'hooks/useSuperAdmin';

// ==============================|| SYSTEM (SUPER ADMIN) LAYOUT ||============================== //

const SystemLayout = () => {
  const { user, logout } = useSuperAdmin();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" sx={{ bgcolor: '#0056b3' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quản trị hệ thống — Chuyển đổi database kỳ thi
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.name || user.email}
            </Typography>
          )}
          <Button color="inherit" startIcon={<LogoutOutlined />} onClick={logout}>
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default SystemLayout;
