import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
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
  Typography,
  useMediaQuery
} from '@mui/material';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

// project import
import IconButton from 'components/@extended/IconButton';
import Loader from 'components/Loader';
import SystemDrawer from './Drawer';
import useSuperAdmin from 'hooks/useSuperAdmin';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| SYSTEM (SUPER ADMIN) LAYOUT ||============================== //
// Menu trái mở/thu gọn được, phỏng theo layout/Dashboard (dùng chung NavGroup/NavItem + trạng thái
// đóng/mở toàn cục ở api/menu) — chỉ khác nguồn menu (menu-items/system.js, tĩnh) và AppBar riêng
// (không dùng Header/HeaderContent của app chính vì nó phụ thuộc JWTContext, không hợp với phiên
// đăng nhập Super Admin tách biệt).

const SystemLayout = () => {
  const theme = useTheme();
  const { user, logout } = useSuperAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));

  useEffect(() => {
    handlerDrawerOpen(!matchDownXL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  if (menuMasterLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <SystemDrawer />
      <Box sx={{ flexGrow: 1, width: { xs: '100%', md: 0 } }}>
        <AppBar position="static" sx={{ bgcolor: '#0056b3' }}>
          <Toolbar>
            <IconButton
              aria-label="open drawer"
              onClick={() => handlerDrawerOpen(!drawerOpen)}
              edge="start"
              sx={{ color: 'common.white', mr: 1 }}
            >
              {!drawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Hệ thống Quản lý Kì thi - Exam Management System
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
      </Box>
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
