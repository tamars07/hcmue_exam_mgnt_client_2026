/* eslint-disable react/prop-types */
import React, { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Typography,
  Stack,
  IconButton
} from '@mui/material';

const MultiRestoreDialog = ({
  open,
  onClose,
  onConfirm,
  examinees,
  selectedAccounts,
  onToggle,
  onSelectAll,
  onClearAll,
  message,
  setMessage
}) => {
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const list = (examinees || []).filter((e) => e.username && (e.status === 'ĐANG THI' || e.status === 'ĐÃ NỘP BÀI'));

    const k = keyword.toLowerCase().trim();
    if (!k) return list;

    return list.filter(
      (e) =>
        e.fullname?.toLowerCase().includes(k) ||
        e.username?.toLowerCase().includes(k) ||
        e.code?.toLowerCase().includes(k) ||
        String(e.seat_number || '')
          .toLowerCase()
          .includes(k) ||
        e.id_card_number?.toLowerCase().includes(k)
    );
  }, [examinees, keyword]);

  const handleSelectAllFiltered = () => {
    onSelectAll(filtered.map((e) => e.username));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ĐANG THI':
        return '#1B5E20';
      case 'CHỜ THI':
        return '#ED6C02';
      case 'ĐÃ NỘP BÀI':
        return '#D32F2F';
      default:
        return '#666';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Phục hồi nhiều thí sinh</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm theo họ tên, SBD, tài khoản, số máy, CCCD"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: keyword ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setKeyword('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button onClick={handleSelectAllFiltered}>Chọn tất cả</Button>
          <Button variant="outlined" onClick={() => onSelectAll(filtered.filter((e) => e.status === 'ĐANG THI').map((e) => e.username))}>
            Chọn ĐANG THI
          </Button>
          <Button variant="outlined" onClick={() => onSelectAll(filtered.filter((e) => e.status === 'ĐÃ NỘP BÀI').map((e) => e.username))}>
            Chọn ĐÃ NỘP BÀI
          </Button>
          <Button variant="outlined" color='error' onClick={onClearAll}>Bỏ chọn</Button>
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>Đã chọn: {selectedAccounts.length}</Typography>
        </Stack>

        <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd' }}>
          <List dense>
            {filtered.map((item) => (
              <React.Fragment key={item.username}>
                <ListItem button onClick={() => onToggle(item.username)}>
                  <Checkbox checked={selectedAccounts.includes(item.username)} />
                  <ListItemText
                    primary={`${item.fullname} - ${item.username}`}
                    secondary={
                      <>
                        <span style={{ color: getStatusColor(item.status), fontWeight: 600 }}>{item.status}</span>
                        {` | SBD: ${item.code || ''} | Máy: ${item.seat_number || ''} | CCCD: ${item.id_card_number || ''}`}
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Box>

        <TextField fullWidth label="Lý do" multiline rows={3} value={message} onChange={(e) => setMessage(e.target.value)} sx={{ mt: 2 }} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={onConfirm} color="warning" disabled={!selectedAccounts.length || !message.trim()}>
          Phục hồi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultiRestoreDialog;
