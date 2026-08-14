import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';

// project import
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| LOADING OVERLAY ||============================== //

const LoadingOverlay = () => {
  const { open, message } = useLoadingOverlay();

  return (
    <Backdrop open={open} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 10 }}>
      <Stack spacing={2} alignItems="center" sx={{ px: 3, textAlign: 'center' }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6">{message}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Vui lòng không tắt hoặc rời khỏi trang trong lúc này.
        </Typography>
      </Stack>
    </Backdrop>
  );
};

export default LoadingOverlay;
