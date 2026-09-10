import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ActiveRoomDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography>Xác nhận kích hoạt phòng thi?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Hủy
        </Button>
        <Button onClick={onConfirm} color="error">
          Kích hoạt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActiveRoomDialog;
