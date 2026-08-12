import React from 'react';
import { Backdrop, CircularProgress, Typography } from '@mui/material';

const LoadingOverlay = ({ open, message }) => {
  return (
    <Backdrop
      open={open}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal + 999,
        flexDirection: 'column',
        backgroundColor: 'rgba(0, 0, 0, 0.45)'
      }}
    >
      <CircularProgress color="inherit" size={42} />
      <Typography sx={{ mt: 2, fontWeight: 600, fontSize: '1rem' }}>{message || 'Đang xử lý...'}</Typography>
    </Backdrop>
  );
};

export default LoadingOverlay;
