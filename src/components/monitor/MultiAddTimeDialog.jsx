import React, { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Stack
} from '@mui/material';

const MultiAddTimeDialog = ({
  open,
  onClose,
  onConfirm,
  room,
  examinees,
  selectedAccounts,
  onToggleExaminee,
  onSelectAll,
  onClearAll,
  addTime,
  setAddTime,
  logMessage,
  setLogMessage
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  const selectableExaminees = useMemo(() => {
    // const baseList = (examinees || []).filter((item) => item.username && item.status !== 'ĐÃ NỘP BÀI');
    const baseList = (examinees || []).filter((item) => item.username && (item.status === 'ĐÃ NỘP BÀI' || item.status === 'ĐANG THI'));

    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return baseList;

    return baseList.filter((item) => {
      const fullname = (item.fullname || '').toLowerCase();
      const username = (item.username || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const seatNumber = String(item.seat_number || '').toLowerCase();
      const idCardNumber = (item.id_card_number || '').toLowerCase();

      return (
        fullname.includes(keyword) ||
        username.includes(keyword) ||
        code.includes(keyword) ||
        seatNumber.includes(keyword) ||
        idCardNumber.includes(keyword)
      );
    });
  }, [examinees, searchKeyword]);

  const handleClose = () => {
    setSearchKeyword('');
    onClose();
  };

  const handleSelectAllFiltered = () => {
    const usernames = selectableExaminees.map((item) => item.username);
    onSelectAll(usernames);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bù giờ nhiều thí sinh - Phòng {room}</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm theo họ tên, SBD, tài khoản, số máy, CCCD"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchKeyword ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="outlined" onClick={handleSelectAllFiltered}>
            Chọn tất cả đang hiển thị
          </Button>
          <Button variant="outlined" color="inherit" onClick={onClearAll}>
            Bỏ chọn
          </Button>
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            Đã chọn: <strong style={{ marginLeft: 4 }}>{selectedAccounts.length}</strong>
          </Typography>
          <Typography sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            Kết quả: <strong style={{ marginLeft: 4 }}>{selectableExaminees.length}</strong>
          </Typography>
        </Stack>

        <Box
          sx={{
            border: '1px solid #ddd',
            borderRadius: 1,
            maxHeight: 300,
            overflowY: 'auto',
            mb: 2
          }}
        >
          <List dense>
            {selectableExaminees.length ? (
              selectableExaminees.map((item, index) => (
                <React.Fragment key={item.username || index}>
                  <ListItem button onClick={() => onToggleExaminee(item.username)}>
                    <Checkbox checked={selectedAccounts.includes(item.username)} />
                    <ListItemText
                      primary={`${item.fullname} - ${item.username}`}
                      secondary={`SBD: ${item.code || ''} | Máy: ${item.seat_number || ''} | Trạng thái: ${item.status} | CCCD: ${
                        item.id_card_number || ''
                      }`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">Không tìm thấy thí sinh phù hợp.</Typography>
              </Box>
            )}
          </List>
        </Box>

        <OutlinedInput
          fullWidth
          id="multi_add_time"
          value={addTime}
          endAdornment={<InputAdornment position="end">phút</InputAdornment>}
          inputProps={{ 'aria-label': 'phút' }}
          onChange={(event) => setAddTime(parseInt(event.target.value, 10) || 0)}
          sx={{ mb: 2 }}
        />

        <TextField
          value={logMessage}
          required
          label="Lý do"
          type="text"
          fullWidth
          multiline
          rows={4}
          onChange={(event) => setLogMessage(event.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Hủy
        </Button>
        <Button onClick={onConfirm} color="error" disabled={!selectedAccounts.length || !addTime}>
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultiAddTimeDialog;
