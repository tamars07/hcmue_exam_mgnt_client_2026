import PropTypes from 'prop-types';
import { createContext, useCallback, useMemo, useState } from 'react';

// material-ui
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

// ==============================|| CONFIRM CONTEXT & PROVIDER ||============================== //
// Thay cho window.confirm() (dialog mặc định của trình duyệt, không theo theme, không tuỳ biến
// được) — confirm(options) trả về Promise<boolean>, resolve true/false theo nút người dùng bấm.
// options có thể chỉ là 1 chuỗi (dùng làm message) hoặc object { title, message, confirmText,
// cancelText, confirmColor }.

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};

    return new Promise((resolve) => {
      setState({
        title: opts.title || 'Xác nhận',
        message: opts.message || '',
        confirmText: opts.confirmText || 'Xác nhận',
        cancelText: opts.cancelText || 'Huỷ',
        confirmColor: opts.confirmColor || 'primary',
        resolve
      });
    });
  }, []);

  const handleClose = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={!!state} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{state?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{state?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)}>{state?.cancelText}</Button>
          <Button variant="contained" color={state?.confirmColor} onClick={() => handleClose(true)} autoFocus>
            {state?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

ConfirmProvider.propTypes = {
  children: PropTypes.node
};

export default ConfirmContext;
