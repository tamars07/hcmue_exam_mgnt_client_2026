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

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';

// ==============================|| CHI TIẾT BÀI LÀM CỦA 1 THÍ SINH ||============================== //

const ExamineeDetailDialog = ({ open, onClose, account, fullname }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !account) return;
    setLoading(true);
    setData(null);
    chairmanService
      .getExamineeDetail(account)
      .then((res) => setData(res.data.data))
      .catch((e) => openSnackbar({ open: true, message: e?.message || 'Không tải được chi tiết bài làm', variant: 'alert', alert: { color: 'error' } }))
      .finally(() => setLoading(false));
  }, [open, account]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <span>
            Chi tiết làm bài -{' '}
            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
              {fullname ? `${fullname} | ${account}` : account}
            </Typography>
          </span>
          {data && (
            <Typography component="span" sx={{ color: 'error.main', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
              Tiến độ: {data.count}/{data.total}
            </Typography>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography color="text.secondary">Đang tải...</Typography>
        ) : !data ? (
          <Typography color="text.secondary">Không có dữ liệu.</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {data.start_at && <Chip label={`Bắt đầu: ${data.start_at}`} size="small" />}
              {data.finish_at && <Chip label={`Nộp bài: ${data.finish_at}`} size="small" color="success" />}
              {!data.finish_at && data.expected_finish_at && (
                <Chip label={`Giờ kết thúc dự kiến: ${data.expected_finish_at}`} size="small" color="warning" />
              )}
              {data.bonus_time > 0 && <Chip label={`Bù giờ: ${data.bonus_time} phút`} size="small" color="info" />}
            </Stack>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Câu</TableCell>
                    <TableCell>Thời điểm trả lời</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.details.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{d.number}</TableCell>
                      <TableCell>{d.submitting_time || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

ExamineeDetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.string,
  fullname: PropTypes.string
};

export default ExamineeDetailDialog;
