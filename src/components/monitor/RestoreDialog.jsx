import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Button, Typography, TextField } from '@mui/material';

const RestoreDialog = ({ open, onClose, onConfirm, currentCard, logMessage, setLogMessage }) => {
  return (
    <Dialog open={open} maxWidth="sm" onClose={onClose}>
      <DialogTitle>Xác nhận phục hồi</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant="body1">Họ tên: {currentCard?.fullname}</Typography>
          <Typography variant="body1">CCCD: {currentCard?.id_card_number}</Typography>
        </DialogContentText>
        <TextField
          value={logMessage}
          autoFocus
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

export default RestoreDialog;
