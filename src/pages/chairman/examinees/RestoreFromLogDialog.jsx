import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| PHỤC HỒI CÂU TRẢ LỜI TỪ NHẬT KÝ ||============================== //
// 3 bước: (1) chọn nguồn dữ liệu khôi phục -> (2) xem bảng so sánh đáp án hiện tại/sau khi khôi phục,
// tick chọn đúng những câu cần ghi đè (mặc định chọn hết) -> (3) xác nhận lại số câu đã chọn rồi mới
// thực sự ghi đè examinee_answers.

const RestoreFromLogDialog = ({ open, onClose, account, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [step, setStep] = useState('setup'); // 'setup' | 'compare' | 'confirm'

  const [restorePoints, setRestorePoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [sourceType, setSourceType] = useState('current');
  const [upToLogTime, setUpToLogTime] = useState('');
  const [message, setMessage] = useState('');

  const [compareRows, setCompareRows] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  useEffect(() => {
    if (!open || !account) return;
    setStep('setup');
    setSourceType('current');
    setUpToLogTime('');
    setMessage('');
    setCompareRows([]);
    setSelectedQuestionIds([]);
    setLoadingPoints(true);
    chairmanService
      .getExamineeActivityLogs(account)
      .then((res) => setRestorePoints(res.data.data.restore_points))
      .catch(() => setRestorePoints([]))
      .finally(() => setLoadingPoints(false));
  }, [open, account]);

  const handlePreview = async () => {
    if (sourceType === 'timestamp' && !upToLogTime) {
      openSnackbar({ open: true, message: 'Vui lòng chọn mốc thời điểm', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      const res = await withLoading(
        () => chairmanService.previewRestoreAnswersFromLog(account, { source_type: sourceType, up_to_log_time: upToLogTime || undefined }),
        'Đang tải dữ liệu so sánh...'
      );
      const rows = res.data.data || [];
      setCompareRows(rows);
      setSelectedQuestionIds(rows.map((r) => r.question_id));
      setStep('compare');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được dữ liệu so sánh', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]));
  };

  const changedCount = useMemo(() => compareRows.filter((r) => r.changed).length, [compareRows]);
  const selectedRows = compareRows.filter((r) => selectedQuestionIds.includes(r.question_id));

  const handleSubmit = async () => {
    try {
      await withLoading(
        () =>
          chairmanService.restoreAnswersFromLog(account, {
            source_type: sourceType,
            up_to_log_time: sourceType === 'timestamp' ? upToLogTime : undefined,
            question_ids: selectedQuestionIds,
            message
          }),
        'Đang khôi phục dữ liệu bài làm... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Đã khôi phục dữ liệu bài làm', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Khôi phục thất bại', variant: 'alert', alert: { color: 'error' } });
      setStep('compare');
    }
  };

  const renderAnswer = (value) => (value === null || value === undefined || value === '' ? '(để trống)' : String(value));

  if (step === 'confirm') {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Xác nhận khôi phục {selectedRows.length} câu — {account}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Ghi đè lại đáp án hiện tại của thí sinh bằng các đáp án dưới đây. Không thể hoàn tác riêng thao tác này.
            </Alert>
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Câu</TableCell>
                    <TableCell>Đáp án hiện tại</TableCell>
                    <TableCell>Đáp án sau khôi phục</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedRows.map((r) => (
                    <TableRow key={r.question_id} sx={{ bgcolor: r.changed ? 'error.lighter' : undefined }}>
                      <TableCell>{r.question_number}</TableCell>
                      <TableCell>{renderAnswer(r.current_answer)}</TableCell>
                      <TableCell sx={{ fontWeight: r.changed ? 700 : 400, color: r.changed ? 'error.main' : undefined }}>
                        {renderAnswer(r.new_answer)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {message.trim() && (
              <Typography variant="body2" color="text.secondary">
                Lý do: {message}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStep('compare')}>Quay lại</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (step === 'compare') {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>So sánh dữ liệu bài làm — {account}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Tick chọn những câu cần ghi đè (mặc định chọn hết). {changedCount}/{compareRows.length} câu có thay đổi so với hiện tại.
            </Alert>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setSelectedQuestionIds(compareRows.map((r) => r.question_id))}>
                Chọn tất cả
              </Button>
              <Button size="small" onClick={() => setSelectedQuestionIds(compareRows.filter((r) => r.changed).map((r) => r.question_id))}>
                Chỉ chọn câu có thay đổi
              </Button>
              <Button size="small" color="warning" onClick={() => setSelectedQuestionIds([])}>
                Bỏ chọn
              </Button>
            </Stack>
            <Box sx={{ maxHeight: 360, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Câu</TableCell>
                    <TableCell>Đáp án hiện tại</TableCell>
                    <TableCell>Đáp án sau khôi phục</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compareRows.map((r) => (
                    <TableRow
                      key={r.question_id}
                      hover
                      onClick={() => toggleQuestion(r.question_id)}
                      sx={{ cursor: 'pointer', bgcolor: r.changed ? 'error.lighter' : undefined }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={selectedQuestionIds.includes(r.question_id)} />
                      </TableCell>
                      <TableCell>{r.question_number}</TableCell>
                      <TableCell>{renderAnswer(r.current_answer)}</TableCell>
                      <TableCell sx={{ fontWeight: r.changed ? 700 : 400, color: r.changed ? 'error.main' : undefined }}>
                        {renderAnswer(r.new_answer)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {compareRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                          Không có dữ liệu câu trả lời nào ở nguồn đã chọn
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
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
          <Button onClick={() => setStep('setup')}>Quay lại</Button>
          <Button variant="contained" disabled={selectedQuestionIds.length === 0 || !message.trim()} onClick={() => setStep('confirm')}>
            Khôi phục ({selectedQuestionIds.length})
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Phục hồi câu trả lời từ nhật ký — {account}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Ghi đè lại câu trả lời hiện tại của thí sinh (bảng examinee_answers) bằng dữ liệu đã lưu trong nhật ký — dùng khi dữ liệu làm
            bài bị mất/sai lệch. Bước tiếp theo sẽ hiện bảng so sánh để chọn đúng câu cần ghi đè trước khi xác nhận.
          </Alert>
          <TextField fullWidth select label="Nguồn dữ liệu" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <MenuItem value="current">Bản đồng bộ gần nhất (answer_logs hiện tại)</MenuItem>
            <MenuItem value="timestamp">Khôi phục đến 1 thời điểm cụ thể</MenuItem>
          </TextField>
          {sourceType === 'timestamp' && (
            <TextField
              fullWidth
              select
              label="Thời điểm khôi phục"
              value={upToLogTime}
              onChange={(e) => setUpToLogTime(e.target.value)}
              disabled={loadingPoints}
              helperText={
                !loadingPoints && restorePoints.length === 0
                  ? 'Chưa có lịch sử trả lời nào cho thí sinh này'
                  : 'Khôi phục về đúng trạng thái câu trả lời tính đến thời điểm được chọn'
              }
            >
              {restorePoints.map((p) => (
                <MenuItem key={p.id} value={p.log_time}>
                  {p.log_time_label} — Câu {p.question_number}: {p.answer_detail || '(để trống)'}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" onClick={handlePreview}>
          Xem trước &amp; chọn câu
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
