import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| RESET KẾT QUẢ BÀI LÀM CỦA THÍ SINH ||============================== //
// Gõ lại đúng SBD để xác nhận — phỏng theo DeleteDatabaseDialog.js (Super Admin).

const ResetResultDialog = ({ open, onClose, examinee, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState('');
  const [releaseSlot, setReleaseSlot] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);

  const alreadyStarted = examinee?.status === 'ĐANG THI' || examinee?.status === 'ĐÃ NỘP BÀI';

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setMessage('');
      setReleaseSlot(false);
      setAcknowledgeRisk(false);
    }
  }, [open]);

  if (!examinee) return null;

  const canSubmit =
    confirmText === examinee.code && message.trim() && (!releaseSlot || !alreadyStarted || acknowledgeRisk);

  const handleSubmit = async () => {
    try {
      await withLoading(
        () =>
          chairmanService.resetExamineeResult(examinee.username, {
            confirm_code: confirmText,
            message,
            release_slot: releaseSlot
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
            <strong>chưa từng đăng nhập</strong>. Nhật ký thao tác vẫn được giữ nguyên để truy vết/khôi phục sau. Không thể hoàn tác riêng
            thao tác này (chỉ có thể khôi phục lại bằng &quot;Phục hồi từ nhật ký&quot; sau khi thí sinh đăng nhập lại).
          </Alert>
          <Typography variant="body2">
            Gõ lại chính xác SBD <strong>{examinee.code}</strong> để xác nhận:
          </Typography>
          <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={examinee.code} autoFocus />
          <TextField fullWidth multiline minRows={2} required label="Lý do" value={message} onChange={(e) => setMessage(e.target.value)} />
          <FormControlLabel
            control={<Checkbox checked={releaseSlot} onChange={(e) => setReleaseSlot(e.target.checked)} />}
            label="Giải phóng đề thi đã dùng (để đề đó có thể được cấp lại cho thí sinh khác)"
          />
          {releaseSlot && alreadyStarted && (
            <Alert severity="warning">
              Thí sinh này đã bắt đầu làm bài — giải phóng đề trong lúc bài làm dở dang có thể gây nhầm lẫn dữ liệu chấm thi.
              <FormControlLabel
                sx={{ display: 'block', mt: 1 }}
                control={<Checkbox checked={acknowledgeRisk} onChange={(e) => setAcknowledgeRisk(e.target.checked)} />}
                label="Tôi hiểu rủi ro và vẫn muốn tiếp tục"
              />
            </Alert>
          )}
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
