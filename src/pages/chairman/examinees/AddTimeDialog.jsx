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
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| BÙ GIỜ LÀM BÀI HÀNG LOẠT ||============================== //
// Chọn thí sinh ngay trong popup này (không cần chọn sẵn trên lưới thí sinh) — đủ điều kiện: đã
// nhận đề làm bài (đang thi) hoặc đã nộp bài. Chưa nhận đề (chờ thi) thì chưa có gì để bù giờ.

const ELIGIBLE_STATUSES = ['ĐANG THI', 'ĐÃ NỘP BÀI'];

const AddTimeDialog = ({ open, onClose, turnCode, roomCode, examinees, onDone }) => {
  const { withLoading } = useLoadingOverlay();
  const [keyword, setKeyword] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [minutes, setMinutes] = useState(10);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      setKeyword('');
      setSelectedAccounts([]);
      setMinutes(10);
      setMessage('');
      setConfirming(false);
    }
  }, [open]);

  const eligible = useMemo(() => (examinees || []).filter((e) => ELIGIBLE_STATUSES.includes(e.status)), [examinees]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return eligible;
    return eligible.filter(
      (e) => e.username?.toLowerCase().includes(k) || e.id_card_number?.toLowerCase().includes(k) || e.fullname?.toLowerCase().includes(k)
    );
  }, [eligible, keyword]);

  const toggle = (username) => {
    setSelectedAccounts((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]));
  };

  const selectedExaminees = eligible.filter((e) => selectedAccounts.includes(e.username));

  const handleSubmit = async () => {
    try {
      await withLoading(async () => {
        if (selectedAccounts.length === 1) {
          await chairmanService.addTime({ turn: turnCode, room: roomCode, account: selectedAccounts[0], time: minutes, message });
        } else {
          await chairmanService.addTimeMultiple({ turn: turnCode, room: roomCode, accounts: selectedAccounts, time: minutes, message });
        }
      }, 'Đang bù giờ làm bài... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã bù giờ làm bài', variant: 'alert', alert: { color: 'success' } });
      onDone?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Bù giờ thất bại', variant: 'alert', alert: { color: 'error' } });
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Xác nhận bù {minutes} phút cho {selectedAccounts.length} thí sinh
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">Áp dụng ngay cho thời gian làm bài còn lại của các thí sinh dưới đây.</Alert>
            <Box sx={{ maxHeight: 260, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <List dense>
                {selectedExaminees.map((e, idx) => (
                  <Box key={e.username}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItemText
                      sx={{ px: 2, py: 0.5 }}
                      primary={`${e.fullname} — ${e.username}`}
                      secondary={`SBD: ${e.code || ''} — Trạng thái: ${e.status}`}
                    />
                  </Box>
                ))}
              </List>
            </Box>
            {message.trim() && (
              <Typography variant="body2" color="text.secondary">
                Lý do: {message}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>Quay lại</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Bù giờ làm bài nhiều thí sinh</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm theo tài khoản / CCCD / họ tên"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              ),
              endAdornment: keyword ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setKeyword('')}>
                    <CloseOutlined />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <Button size="small" onClick={() => setSelectedAccounts(filtered.map((e) => e.username))}>
              Chọn tất cả
            </Button>
            <Button size="small" color="warning" onClick={() => setSelectedAccounts([])}>
              Bỏ chọn
            </Button>
            <Typography variant="body2" color="text.secondary">
              Đã chọn: {selectedAccounts.length}
            </Typography>
          </Stack>

          <Box sx={{ maxHeight: 280, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <List dense disablePadding>
              {filtered.map((e, idx) => (
                <Box key={e.username}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItemButton onClick={() => toggle(e.username)}>
                    <Checkbox size="small" checked={selectedAccounts.includes(e.username)} sx={{ mr: 1 }} />
                    <ListItemText
                      primary={`${e.fullname} — ${e.username}`}
                      secondary={`SBD: ${e.code || ''} — CCCD: ${e.id_card_number || ''} — ${e.status}`}
                    />
                  </ListItemButton>
                </Box>
              ))}
              {filtered.length === 0 && (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Không có thí sinh nào đủ điều kiện bù giờ
                </Typography>
              )}
            </List>
          </Box>

          <TextField
            fullWidth
            type="number"
            label="Số phút bù thêm"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value, 10) || 0))}
          />
          <TextField fullWidth multiline minRows={2} label="Lý do (nếu cần)" value={message} onChange={(e) => setMessage(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" disabled={selectedAccounts.length === 0 || minutes <= 0} onClick={() => setConfirming(true)}>
          Bù giờ ({selectedAccounts.length})
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
  examinees: PropTypes.array,
  onDone: PropTypes.func
};

export default AddTimeDialog;
