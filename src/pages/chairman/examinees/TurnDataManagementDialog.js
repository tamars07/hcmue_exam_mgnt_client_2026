import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| QUẢN LÝ DỮ LIỆU CA THI ||============================== //
// Sao lưu Dữ liệu bài thi (chỉ sau khi ca thi kết thúc) -> Dọn dẹp dữ liệu (chỉ sau khi đã sao lưu).
// Bắt đầu/Kết thúc/Mở lại ca thi đã chuyển sang trang "Quản lý ca thi" — ở đây chỉ hiển thị lại
// trạng thái hiện tại (đọc, không thao tác) để biết còn thiếu bước nào.

const TURN_STATUS_ICONS = {
  pending: <ClockCircleOutlined />,
  running: <CheckCircleOutlined />,
  ended: <StopOutlined />
};

const TurnDataManagementDialog = ({ open, onClose, turnCode, onChanged }) => {
  const { withLoading } = useLoadingOverlay();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null); // 'backup' | null
  const [actionMessage, setActionMessage] = useState('');
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState('');
  const [cleanupMessage, setCleanupMessage] = useState('');

  const fetchStatus = useCallback(() => {
    if (!turnCode) return;
    setLoading(true);
    chairmanService
      .getTurnDataStatus(turnCode)
      .then((res) => setStatus(res.data.data))
      .catch(() => openSnackbar({ open: true, message: 'Không tải được trạng thái dữ liệu ca thi', variant: 'alert', alert: { color: 'error' } }))
      .finally(() => setLoading(false));
  }, [turnCode]);

  useEffect(() => {
    if (open) {
      setConfirmAction(null);
      setActionMessage('');
      setCleanupOpen(false);
      setCleanupConfirmText('');
      setCleanupMessage('');
      fetchStatus();
    }
  }, [open, fetchStatus]);

  if (!turnCode) return null;

  const refresh = () => {
    fetchStatus();
    onChanged?.();
  };

  const handleBackup = async () => {
    try {
      const res = await withLoading(
        () => chairmanService.backupTurnData(turnCode, actionMessage),
        'Đang sao lưu dữ liệu bài thi... Vui lòng chờ'
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      const pad = (n) => String(n).padStart(2, '0');
      const d = new Date();
      a.download = `${turnCode}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.bak`;
      a.click();
      window.URL.revokeObjectURL(url);
      openSnackbar({ open: true, message: 'Đã sao lưu dữ liệu bài thi, file đang được tải về', variant: 'alert', alert: { color: 'success' } });
      setConfirmAction(null);
      refresh();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Sao lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleCleanup = async () => {
    try {
      await withLoading(
        () => chairmanService.cleanupTurnData(turnCode, cleanupConfirmText, cleanupMessage),
        'Đang sao lưu toàn bộ database và dọn dẹp dữ liệu... Vui lòng chờ, quá trình này có thể mất vài phút'
      );
      openSnackbar({ open: true, message: 'Đã dọn dẹp dữ liệu ca thi', variant: 'alert', alert: { color: 'success' } });
      setCleanupOpen(false);
      refresh();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Dọn dẹp thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const notStarted = status && !status.started_at && !status.ended_at;
  const running = status && status.started_at && !status.ended_at;
  const ended = status && !!status.ended_at;
  const statusKey = notStarted ? 'pending' : running ? 'running' : 'ended';
  const statusLabel = notStarted ? 'Chưa bắt đầu' : running ? 'Đang diễn ra' : 'Đã kết thúc';
  const statusColor = notStarted ? 'default' : running ? 'success' : 'default';

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Quản lý dữ liệu ca thi — {turnCode}</DialogTitle>
        <DialogContent dividers>
          {loading && !status ? (
            <Typography color="text.secondary">Đang tải...</Typography>
          ) : (
            status && (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái ca thi:
                  </Typography>
                  <Chip size="small" color={statusColor} label={statusLabel} icon={TURN_STATUS_ICONS[statusKey]} />
                  {!ended && (
                    <Typography variant="caption" color="text.secondary">
                      (Bắt đầu/Kết thúc/Mở lại ca thi ở trang &quot;Quản lý ca thi&quot;)
                    </Typography>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">1. Sao lưu Dữ liệu bài thi</Typography>
                    {status.is_backup && <Chip size="small" color="success" label="Đã sao lưu" icon={<CheckCircleOutlined />} />}
                  </Stack>
                  {!ended && <Alert severity="info">Chỉ có thể sao lưu sau khi ca thi đã kết thúc.</Alert>}
                  <Button
                    variant="outlined"
                    disabled={!ended}
                    onClick={() => {
                      setActionMessage('');
                      setConfirmAction('backup');
                    }}
                  >
                    Sao lưu Dữ liệu bài thi
                  </Button>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">2. Dọn dẹp dữ liệu</Typography>
                    {status.is_cleaned && <Chip size="small" color="success" label="Đã dọn dẹp" icon={<CheckCircleOutlined />} />}
                  </Stack>
                  {status.cleaned_at && (
                    <Typography variant="body2" color="text.secondary">
                      Đã dọn dẹp lúc: {status.cleaned_at}
                    </Typography>
                  )}
                  {!status.is_backup && <Alert severity="info">Chỉ có thể dọn dẹp sau khi đã sao lưu Dữ liệu bài thi.</Alert>}
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={!status.is_backup || status.is_cleaned}
                    onClick={() => {
                      setCleanupConfirmText('');
                      setCleanupMessage('');
                      setCleanupOpen(true);
                    }}
                  >
                    Dọn dẹp dữ liệu
                  </Button>
                </Stack>
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận Sao lưu Dữ liệu bài thi */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)} fullWidth maxWidth="sm">
        <DialogTitle>Xác nhận Sao lưu Dữ liệu bài thi</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Xuất toàn bộ dữ liệu bài thi của ca thi <strong>{turnCode}</strong> ra file .bak để tải về.
            </Alert>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Ghi chú (không bắt buộc)"
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Huỷ</Button>
          <Button variant="contained" onClick={handleBackup}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận Dọn dẹp dữ liệu — gõ lại mã ca thi vì đây là thao tác phá huỷ dữ liệu dùng chung */}
      <Dialog open={cleanupOpen} onClose={() => setCleanupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Xác nhận Dọn dẹp dữ liệu</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="error">
              Hệ thống sẽ tự động sao lưu toàn bộ database hiện tại (giống Backup ở Quản trị hệ thống), sau đó xoá sạch dữ liệu đề thi/câu
              hỏi/kết quả dùng chung (activity_logs, answer_keys, council_turn_test_mixes, examinee_answers, examinee_test_mixes, questions,
              test_mixes) để
              giải phóng cho ca thi tiếp theo. Không thể hoàn tác thao tác này (chỉ khôi phục được từ bản sao lưu toàn DB vừa tạo).
            </Alert>
            <Typography variant="body2">
              Gõ lại chính xác mã ca thi <strong>{turnCode}</strong> để xác nhận:
            </Typography>
            <TextField fullWidth value={cleanupConfirmText} onChange={(e) => setCleanupConfirmText(e.target.value)} placeholder={turnCode} autoFocus />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Ghi chú (không bắt buộc)"
              value={cleanupMessage}
              onChange={(e) => setCleanupMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupOpen(false)}>Huỷ</Button>
          <Button color="error" variant="contained" disabled={cleanupConfirmText !== turnCode} onClick={handleCleanup}>
            Xác nhận dọn dẹp
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

TurnDataManagementDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turnCode: PropTypes.string,
  onChanged: PropTypes.func
};

export default TurnDataManagementDialog;
