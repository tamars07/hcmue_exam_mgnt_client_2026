import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| PHỤC HỒI CÂU TRẢ LỜI TỪ NHẬT KÝ ||============================== //

const RestoreFromLogDialog = ({ open, onClose, account, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [restorePoints, setRestorePoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState('current');
  const [activityLogId, setActivityLogId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !account) return;
    setSourceType('current');
    setActivityLogId('');
    setQuestionId('');
    setMessage('');
    setLoading(true);
    chairmanService
      .getExamineeActivityLogs(account)
      .then((res) => setRestorePoints(res.data.data.restore_points))
      .catch(() => setRestorePoints([]))
      .finally(() => setLoading(false));
  }, [open, account]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      openSnackbar({ open: true, message: 'Vui lòng nhập lý do khôi phục', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    if (sourceType === 'log' && !activityLogId) {
      openSnackbar({ open: true, message: 'Vui lòng chọn mốc nhật ký', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      await withLoading(
        () =>
          chairmanService.restoreAnswersFromLog(account, {
            source_type: sourceType,
            activity_log_id: sourceType === 'log' ? activityLogId : undefined,
            question_id: questionId ? parseInt(questionId, 10) : undefined,
            message
          }),
        'Đang khôi phục dữ liệu bài làm... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Đã khôi phục dữ liệu bài làm', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Khôi phục thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Phục hồi câu trả lời từ nhật ký — {account}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Ghi đè lại câu trả lời hiện tại của thí sinh bằng dữ liệu đã lưu trong nhật ký — dùng khi dữ liệu làm bài bị mất/sai lệch.
          </Alert>
          <TextField fullWidth select label="Nguồn dữ liệu" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <MenuItem value="current">Bản đồng bộ gần nhất (answer_logs hiện tại)</MenuItem>
            <MenuItem value="log">Chọn 1 mốc nhật ký cụ thể</MenuItem>
          </TextField>
          {sourceType === 'log' && (
            <TextField
              fullWidth
              select
              label="Mốc nhật ký"
              value={activityLogId}
              onChange={(e) => setActivityLogId(e.target.value)}
              disabled={loading}
              helperText={!loading && restorePoints.length === 0 ? 'Chưa có mốc nhật ký nào cho thí sinh này' : ''}
            >
              {restorePoints.map((p) => (
                <MenuItem key={p.activity_log_id} value={p.activity_log_id}>
                  {p.log_time} — {p.question_count} câu
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            type="number"
            label="Chỉ khôi phục 1 câu (để trống = toàn bộ bài làm)"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
          />
          <TextField fullWidth multiline minRows={2} required label="Lý do" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Typography variant="caption" color="text.secondary">
            Thao tác này sẽ được ghi lại trong nhật ký để đối chiếu sau này.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Xác nhận khôi phục
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RestoreFromLogDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.string,
  onDone: PropTypes.func
};

export default RestoreFromLogDialog;
