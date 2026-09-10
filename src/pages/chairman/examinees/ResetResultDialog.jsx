import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| RESET KẾT QUẢ BÀI LÀM CỦA THÍ SINH ||============================== //
// Gõ lại đúng tên tài khoản để xác nhận — phỏng theo DeleteDatabaseDialog.js (Super Admin). Đề đã
// dùng KHÔNG được giải phóng (xem ChairmanExamineeController::resetResult()) nên không có tuỳ chọn
// "giải phóng đề" ở đây nữa.

const ResetResultDialog = ({ open, onClose, examinee, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setMessage('');
    }
  }, [open]);

  if (!examinee) return null;

  const canSubmit = confirmText === examinee.username && message.trim();

  const handleSubmit = async () => {
    try {
      await withLoading(
        () =>
          chairmanService.resetExamineeResult(examinee.username, {
            confirm_code: confirmText,
            message
          }),
        'Đang reset kết quả bài làm... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Đã reset kết quả bài làm', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Reset thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reset kết quả bài làm</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="error">
            Xoá toàn bộ bài làm hiện tại của thí sinh <strong>{examinee.fullname}</strong> ({examinee.code}), đưa về trạng thái như{' '}
            <strong>chưa từng đăng nhập</strong>. Đề thi đã dùng vẫn bị đánh dấu là đã dùng, không cấp lại cho thí sinh khác. Nhật ký thao
            tác vẫn được giữ nguyên để truy vết/khôi phục sau. Không thể hoàn tác riêng thao tác này (chỉ có thể khôi phục lại bằng
            &quot;Phục hồi từ nhật ký&quot; sau khi thí sinh đăng nhập lại).
          </Alert>
          <Typography variant="body2">
            Gõ lại chính xác tên tài khoản <strong>{examinee.username}</strong> để xác nhận:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={examinee.username}
            autoFocus
          />
          <TextField fullWidth multiline minRows={2} required label="Lý do" value={message} onChange={(e) => setMessage(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button color="error" variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          Xác nhận reset
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ResetResultDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  examinee: PropTypes.object,
  onDone: PropTypes.func
};

export default ResetResultDialog;
