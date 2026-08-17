import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| BÙ GIỜ LÀM BÀI (ĐƠN / HÀNG LOẠT) ||============================== //

const AddTimeDialog = ({ open, onClose, turnCode, roomCode, accounts, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [minutes, setMinutes] = useState(10);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setMinutes(10);
      setMessage('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      openSnackbar({ open: true, message: 'Vui lòng nhập lý do bù giờ', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      await withLoading(async () => {
        if (accounts.length === 1) {
          await chairmanService.addTime({ turn: turnCode, room: roomCode, account: accounts[0], time: minutes, message });
        } else {
          await chairmanService.addTimeMultiple({ turn: turnCode, room: roomCode, accounts, time: minutes, message });
        }
      }, 'Đang bù giờ làm bài... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã bù giờ làm bài', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Bù giờ thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Bù giờ làm bài ({accounts.length} thí sinh)</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {accounts.join(', ')}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Số phút bù thêm"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value, 10) || 0))}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            required
            label="Lý do"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Alert severity="info">Áp dụng ngay cho thời gian làm bài còn lại của thí sinh.</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" disabled={minutes <= 0} onClick={handleSubmit}>
          Xác nhận bù giờ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddTimeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turnCode: PropTypes.string,
  roomCode: PropTypes.string,
  accounts: PropTypes.array,
  onDone: PropTypes.func
};

export default AddTimeDialog;
