import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { UploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| PHỤC HỒI DATABASE CÓ SẴN TỪ FILE BACKUP ||============================== //

const RestoreBackupDialog = ({ open, onClose, examDatabase, allBackups, onRestored }) => {
  const { withLoading } = useLoadingOverlay();
  const [source, setSource] = useState('upload'); // 'upload' | 'existing'
  const [file, setFile] = useState(null);
  const [sourceBackupId, setSourceBackupId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ownBackups = (allBackups || []).filter((b) => b.exam_database_id === examDatabase?.id);

  useEffect(() => {
    if (open) {
      // Nếu database này đã có sẵn backup trong hệ thống, ưu tiên chọn luôn từ đó thay vì bắt phải
      // tải file từ ngoài lên — chỉ rơi về "tải file lên" khi chưa có bản backup nào.
      setSource(ownBackups.length > 0 ? 'existing' : 'upload');
      setFile(null);
      setSourceBackupId(ownBackups.length > 0 ? ownBackups[0].id : '');
      setConfirmText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, examDatabase?.id]);

  if (!examDatabase) return null;

  const canSubmit = !submitting && confirmText === examDatabase.db_name && (source === 'upload' ? !!file : !!sourceBackupId);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('confirm_db_name', confirmText);
      if (source === 'upload' && file) {
        formData.append('file', file);
      } else if (sourceBackupId) {
        formData.append('source_backup_id', sourceBackupId);
      }
      await withLoading(
        () => systemAdminService.restoreBackup(examDatabase.id, formData),
        'Đang sao lưu dữ liệu hiện tại, xoá bảng cũ và phục hồi từ file backup... Vui lòng chờ, quá trình này có thể mất vài phút'
      );
      openSnackbar({ open: true, message: 'Đã phục hồi dữ liệu thành công', variant: 'alert', alert: { color: 'success' } });
      onRestored?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Phục hồi thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Phục hồi database từ file backup</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="error">
            Thao tác này sẽ <strong>xoá toàn bộ bảng hiện có</strong> của database <strong>{examDatabase.label}</strong> (
            {examDatabase.db_name}) rồi nạp lại dữ liệu từ file backup đã chọn. Hệ thống sẽ tự động sao lưu dữ liệu hiện tại trước khi
            xoá để có đường lùi, nhưng mọi thay đổi phát sinh sau thời điểm file backup được tạo sẽ mất, không thể hoàn tác.
          </Alert>

          {ownBackups.length > 0 && (
            <RadioGroup row value={source} onChange={(e) => setSource(e.target.value)}>
              <FormControlLabel value="existing" control={<Radio />} label="Dùng bản backup có sẵn của DB này" />
              <FormControlLabel value="upload" control={<Radio />} label="Tải file khác lên" />
            </RadioGroup>
          )}
          {source === 'upload' ? (
            <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
              {file ? file.name : 'Chọn file .sql hoặc .sql.gz'}
              <input type="file" hidden accept=".sql,.gz" onChange={(e) => setFile(e.target.files[0] || null)} />
            </Button>
          ) : (
            <TextField fullWidth select label="Chọn bản backup" value={sourceBackupId} onChange={(e) => setSourceBackupId(e.target.value)}>
              {ownBackups.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {new Date(b.created_at).toLocaleString('vi-VN')}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Typography variant="body2">
            Gõ lại chính xác tên database <strong>{examDatabase.db_name}</strong> để xác nhận:
          </Typography>
          <TextField fullWidth value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={examDatabase.db_name} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button color="error" variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Đang phục hồi...' : 'Phục hồi database'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RestoreBackupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  examDatabase: PropTypes.object,
  allBackups: PropTypes.array,
  onRestored: PropTypes.func
};

export default RestoreBackupDialog;
