import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| XOÁ HẲN DATABASE (GÕ LẠI TÊN ĐỂ XÁC NHẬN) ||============================== //

const DeleteDatabaseDialog = ({ open, onClose, examDatabase, onDeleted }) => {
  const { withLoading } = useLoadingOverlay();
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setConfirmText('');
  }, [open]);

  if (!examDatabase) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await withLoading(
        () => systemAdminService.deleteExamDatabase(examDatabase.id, confirmText),
        'Đang xoá hẳn database... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Đã xoá hẳn database', variant: 'alert', alert: { color: 'success' } });
      onDeleted?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Xoá hẳn database</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="error">
            Thao tác này sẽ <strong>DROP DATABASE</strong> thật sự trên server, xoá toàn bộ dữ liệu của kỳ thi{' '}
            <strong>{examDatabase.label}</strong> ({examDatabase.db_name}). Không thể hoàn tác. Các bản backup đã tải xuống trước đó
            (nếu có) sẽ được giữ lại trên server.
          </Alert>
          <Typography variant="body2">
            Gõ lại chính xác tên database <strong>{examDatabase.db_name}</strong> để xác nhận:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={examDatabase.db_name}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button color="error" variant="contained" disabled={confirmText !== examDatabase.db_name || submitting} onClick={handleDelete}>
          {submitting ? 'Đang xoá...' : 'Xoá hẳn database'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeleteDatabaseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  examDatabase: PropTypes.object,
  onDeleted: PropTypes.func
};

export default DeleteDatabaseDialog;
