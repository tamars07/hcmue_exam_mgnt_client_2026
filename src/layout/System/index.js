import { useState } from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { LogoutOutlined } from '@ant-design/icons';

// project import
import useSuperAdmin from 'hooks/useSuperAdmin';

// ==============================|| SYSTEM (SUPER ADMIN) LAYOUT ||============================== //

const SystemLayout = () => {
  const { user, logout } = useSuperAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" sx={{ bgcolor: '#0056b3' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quản trị hệ thống — Chuyển đổi database kỳ thi
          </Typography>
          {user && (
            <Stack sx={{ mr: 2, textAlign: 'right' }} spacing={0}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {user.name || user.email}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75, lineHeight: 1.3 }}>
                Super Admin
              </Typography>
            </Stack>
          )}
          <Button color="inherit" startIcon={<LogoutOutlined />} onClick={() => setConfirmOpen(true)}>
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận đăng xuất</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc chắn muốn đăng xuất không?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button variant="contained" color="error" onClick={logout}>
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemLayout;
