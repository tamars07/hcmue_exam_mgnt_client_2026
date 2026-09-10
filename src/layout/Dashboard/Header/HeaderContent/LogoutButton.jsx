import { useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

// project import
import useAuth from 'hooks/useAuth';

// assets
import { LogoutOutlined } from '@ant-design/icons';

// ==============================|| HEADER CONTENT - LOGOUT ||============================== //

const LogoutButton = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { state: { from: '' } });
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <Button color="secondary" sx={{ color: 'text.primary' }} startIcon={<LogoutOutlined />} aria-label="logout" onClick={() => setConfirmOpen(true)}>
        Đăng xuất
      </Button>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận đăng xuất</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc chắn muốn đăng xuất không?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huỷ</Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogoutButton;
