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
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField
} from '@mui/material';
import { UploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

const DB_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const DB_NAME_PREFIX = 'hcmue_council_';

const CREATE_MODE_MESSAGE = {
  migrate: 'Đang tạo database và dựng cấu trúc + dữ liệu mẫu... Vui lòng chờ',
  restore: 'Đang tạo database và phục hồi dữ liệu từ backup... Vui lòng chờ, quá trình này có thể mất vài phút',
  register: 'Đang đăng ký database... Vui lòng chờ'
};

// ==============================|| THÊM MỚI DATABASE KỲ THI ||============================== //

const CreateDatabaseDialog = ({ open, onClose, allBackups, onCreated }) => {
  const { withLoading } = useLoadingOverlay();
  const [mode, setMode] = useState('migrate'); // 'migrate' | 'restore' | 'register'
  const [label, setLabel] = useState('');
  const [dbName, setDbName] = useState('');
  const [restoreSource, setRestoreSource] = useState('upload'); // 'upload' | 'existing'
  const [file, setFile] = useState(null);
  const [sourceBackupId, setSourceBackupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode('migrate');
      setLabel('');
      setDbName('');
      setRestoreSource('upload');
      setFile(null);
      setSourceBackupId('');
    }
  }, [open]);

  const usesPrefix = mode !== 'register';
  const fullDbName = usesPrefix ? `${DB_NAME_PREFIX}${dbName}` : dbName;
  const dbNameValid = dbName && DB_NAME_REGEX.test(dbName);

  const canSubmit =
    dbNameValid &&
    !submitting &&
    (mode !== 'restore' || (restoreSource === 'upload' ? !!file : !!sourceBackupId));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('label', label.trim() || fullDbName);
      formData.append('db_name', fullDbName);
      formData.append('mode', mode);
      if (mode === 'restore') {
        if (restoreSource === 'upload' && file) {
          formData.append('file', file);
        } else if (sourceBackupId) {
          formData.append('source_backup_id', sourceBackupId);
        }
      }
      await withLoading(() => systemAdminService.createExamDatabase(formData), CREATE_MODE_MESSAGE[mode]);
      openSnackbar({ open: true, message: 'Tạo database thành công', variant: 'alert', alert: { color: 'success' } });
      onCreated?.();
      onClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Tạo database thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm mới database kỳ thi</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <RadioGroup
            row
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setDbName('');
            }}
          >
            <FormControlLabel value="migrate" control={<Radio />} label="Tạo trống (migrate cấu trúc)" />
            <FormControlLabel value="restore" control={<Radio />} label="Từ file backup" />
            <FormControlLabel value="register" control={<Radio />} label="Đăng ký DB có sẵn" />
          </RadioGroup>

          {mode === 'migrate' && (
            <Alert severity="info">Sẽ tạo 1 database trống và tự động chạy toàn bộ migration để dựng cấu trúc bảng giống hệ thống.</Alert>
          )}
          {mode === 'restore' && (
            <Alert severity="info">Sẽ tạo 1 database trống rồi phục hồi (restore) toàn bộ dữ liệu từ file backup vào đó.</Alert>
          )}
          {mode === 'register' && (
            <Alert severity="warning">
              Dùng khi database đã tồn tại sẵn trên server (ví dụ được tạo từ trước khi có công cụ này) — chỉ đăng ký vào danh mục, không
              tạo/sửa gì trên database thật.
            </Alert>
          )}

          <TextField
            fullWidth
            label="Tên database (db_name)"
            value={dbName}
            onChange={(e) => setDbName(e.target.value.trim())}
            error={!!dbName && !dbNameValid}
            autoFocus
            InputProps={usesPrefix ? { startAdornment: <InputAdornment position="start">{DB_NAME_PREFIX}</InputAdornment> } : undefined}
            helperText={
              dbName && !dbNameValid
                ? 'Chỉ cho phép chữ, số và dấu gạch dưới'
                : mode === 'register'
                ? 'Phải trùng khớp tên database đã tồn tại trên server'
                : `Sẽ tạo database tên: ${fullDbName || DB_NAME_PREFIX}`
            }
          />
          <TextField
            fullWidth
            label="Tên hiển thị (label)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={fullDbName || 'Để trống sẽ tự lấy theo tên database'}
            helperText="Để trống sẽ tự đặt giống tên database"
          />

          {mode === 'restore' && (
            <>
              <RadioGroup row value={restoreSource} onChange={(e) => setRestoreSource(e.target.value)}>
                <FormControlLabel value="upload" control={<Radio />} label="Tải file lên" />
                <FormControlLabel value="existing" control={<Radio />} label="Dùng bản backup có sẵn" />
              </RadioGroup>
              {restoreSource === 'upload' ? (
                <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
                  {file ? file.name : 'Chọn file .sql hoặc .sql.gz'}
                  <input type="file" hidden accept=".sql,.gz" onChange={(e) => setFile(e.target.files[0] || null)} />
                </Button>
              ) : (
                <TextField fullWidth select label="Chọn bản backup" value={sourceBackupId} onChange={(e) => setSourceBackupId(e.target.value)}>
                  {(allBackups || []).map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      [{b.db_label}] {new Date(b.created_at).toLocaleString('vi-VN')}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Đang xử lý...' : 'Tạo database'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CreateDatabaseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  allBackups: PropTypes.array,
  onCreated: PropTypes.func
};

export default CreateDatabaseDialog;
