import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  TextField,
  OutlinedInput,
  InputAdornment
} from '@mui/material';

const AddTimeDialog = ({ open, onClose, onConfirm, currentCard, addTime, setAddTime, logMessage, setLogMessage }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Xác nhận bù giờ</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant="body1">Họ tên: {currentCard?.fullname}</Typography>
          <Typography variant="body1">CCCD: {currentCard?.id_card_number}</Typography>
          <Typography variant="body1">Nhập số phút</Typography>
        </DialogContentText>

        <OutlinedInput
          id="add_time"
          value={addTime}
          endAdornment={<InputAdornment position="end">phút</InputAdornment>}
          inputProps={{ 'aria-label': 'phút' }}
          onChange={(event) => setAddTime(parseInt(event.target.value, 10) || 0)}
        />

        <TextField
          value={logMessage}
          required
          margin="dense"
          label="Lý do"
          type="text"
          fullWidth
          multiline
          rows={4}
          onChange={(event) => setLogMessage(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Hủy
        </Button>
        <Button onClick={onConfirm} color="error">
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTimeDialog;
