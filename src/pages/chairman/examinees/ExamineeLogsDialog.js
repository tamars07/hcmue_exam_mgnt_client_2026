import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  ExportOutlined,
  FileTextOutlined,
  ImportOutlined,
  LoginOutlined,
  LogoutOutlined
} from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';

// ==============================|| GIÁM SÁT KÌ THI - XEM LOGS THÍ SINH ||============================== //

const TIMELINE_LABELS = {
  EXAMINEE_LOGIN: { text: 'Đăng nhập', icon: <LoginOutlined />, color: 'info' },
  EXAMINEE_LOGOUT: { text: 'Đăng xuất', icon: <LogoutOutlined />, color: 'default' },
  START_TEST: { text: 'Nhận đề', icon: <ImportOutlined />, color: 'warning' },
  SUBMIT_TEST: { text: 'Nộp bài', icon: <ExportOutlined />, color: 'success' }
};

const ExamineeLogsDialog = ({ open, onClose, account, fullname }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !account) return;
    setLoading(true);
    setData(null);
    chairmanService
      .getExamineeActivityLogs(account)
      .then((res) => setData(res.data.data))
      .catch((e) => openSnackbar({ open: true, message: e?.message || 'Không tải được nhật ký thí sinh', variant: 'alert', alert: { color: 'error' } }))
      .finally(() => setLoading(false));
  }, [open, account]);

  const timeline = [...(data?.timeline || [])].sort((a, b) => a.id - b.id);
  const answerHistory = data?.answer_history || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <span>
          Nhật ký thao tác -{' '}
          <Typography component="span" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
            {fullname ? `${fullname} | ${account}` : account}
          </Typography>
        </span>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography color="text.secondary">Đang tải...</Typography>
        ) : !data ? (
          <Typography color="text.secondary">Không có dữ liệu.</Typography>
        ) : (
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Đăng nhập / Nhận đề / Nộp bài</Typography>
              {timeline.length === 0 ? (
                <Typography color="text.secondary">Chưa có thao tác nào.</Typography>
              ) : (
                <Stack spacing={0.75}>
                  {timeline.map((row) => {
                    const meta = TIMELINE_LABELS[row.action] || { text: row.action, icon: <FileTextOutlined />, color: 'default' };
                    return (
                      <Stack key={row.id} direction="row" spacing={1.5} alignItems="center">
                        <Chip size="small" color={meta.color} icon={meta.icon} label={meta.text} sx={{ minWidth: 110 }} />
                        <Typography variant="body2" color="text.secondary">
                          {row.log_time}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle1">Lịch sử trả lời câu hỏi</Typography>
              {answerHistory.length === 0 ? (
                <Typography color="text.secondary">Chưa có câu trả lời nào.</Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Câu</TableCell>
                        <TableCell>Loại câu hỏi</TableCell>
                        <TableCell>Câu trả lời</TableCell>
                        <TableCell>Thời điểm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {answerHistory.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.question_number ?? '—'}</TableCell>
                          <TableCell>{row.question_type_name || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {row.answer_detail || <em>(để trống)</em>}
                          </TableCell>
                          <TableCell>{row.log_time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

ExamineeLogsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.string,
  fullname: PropTypes.string
};

export default ExamineeLogsDialog;
