import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| PHỤC HỒI TRẠNG THÁI (ĐƠN / HÀNG LOẠT) ||============================== //
// Mở khoá đăng nhập lại (reset ip_address) + huỷ trạng thái đã nộp bài nếu có — KHÔNG đụng dữ liệu
// câu trả lời đã lưu (khác với "Phục hồi từ nhật ký" / "Reset kết quả").

const RestoreDialog = ({ open, onClose, turnCode, roomCode, accounts, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) setMessage('');
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      openSnackbar({ open: true, message: 'Vui lòng nhập lý do phục hồi', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      await withLoading(async () => {
        if (accounts.length === 1) {
          await chairmanService.restoreExaminee({ turn: turnCode, room: roomCode, account: accounts[0], message });
        } else {
          await chairmanService.restoreMultiple({ turn: turnCode, room: roomCode, accounts, message });
        }
      }, 'Đang phục hồi trạng thái... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã phục hồi trạng thái', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Phục hồi thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Phục hồi trạng thái ({accounts.length} thí sinh)</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {accounts.join(', ')}
          </Typography>
          <Alert severity="info">Cho phép thí sinh đăng nhập lại từ máy khác và tiếp tục làm bài nếu đã lỡ nộp bài.</Alert>
          <TextField
            fullWidth
            multiline
            minRows={2}
            required
            label="Lý do"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Xác nhận phục hồi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RestoreDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turnCode: PropTypes.string,
  roomCode: PropTypes.string,
  accounts: PropTypes.array,
  onDone: PropTypes.func
};

export default RestoreDialog;
