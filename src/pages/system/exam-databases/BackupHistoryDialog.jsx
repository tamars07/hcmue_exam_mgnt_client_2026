import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { CloudDownloadOutlined, DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// Đặt tên file tải về theo tên db + thời điểm backup — không dựa vào header Content-Disposition
// của response (không đọc được qua CORS khi FE/BE khác origin, đã gặp ở tính năng tải zip trước đó).
const formatBackupTimestamp = (isoString) => {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

// ==============================|| LỊCH SỬ BACKUP CỦA 1 DATABASE ||============================== //

const BackupHistoryDialog = ({ open, onClose, examDatabase, onChanged }) => {
  const { withLoading } = useLoadingOverlay();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchBackups = useCallback(async () => {
    if (!examDatabase) return;
    setLoading(true);
    try {
      const res = await systemAdminService.getBackups(examDatabase.id);
      setBackups(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được lịch sử backup', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [examDatabase]);

  useEffect(() => {
    if (open) fetchBackups();
  }, [open, fetchBackups]);

  if (!examDatabase) return null;

  const handleRunBackup = async () => {
    setRunning(true);
    try {
      await withLoading(
        () => systemAdminService.runBackup(examDatabase.id),
        'Đang backup database... Vui lòng chờ, quá trình này có thể mất vài phút'
      );
      openSnackbar({ open: true, message: 'Backup thành công', variant: 'alert', alert: { color: 'success' } });
      fetchBackups();
      onChanged?.();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Backup thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      const res = await withLoading(
        () => systemAdminService.downloadBackup(examDatabase.id, backup.id),
        'Đang tải file backup... Vui lòng chờ'
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examDatabase.db_name}_${formatBackupTimestamp(backup.created_at)}.sql.gz`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Tải backup thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleDeleteBackup = async (backup) => {
    if (!window.confirm(`Xoá bản backup "${backup.file_path.split('/').pop()}"?`)) return;
    try {
      await withLoading(() => systemAdminService.deleteBackup(examDatabase.id, backup.id), 'Đang xoá bản backup... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá bản backup', variant: 'alert', alert: { color: 'success' } });
      fetchBackups();
      onChanged?.();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Lịch sử backup — {examDatabase.label} ({examDatabase.db_name})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Button variant="contained" startIcon={<CloudUploadOutlined />} disabled={running} onClick={handleRunBackup} sx={{ width: 220 }}>
            {running ? 'Đang backup...' : 'Chạy backup ngay'}
          </Button>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Kích thước</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.created_at).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{formatBytes(b.file_size)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Tải về">
                      <IconButton size="small" onClick={() => handleDownload(b)}>
                        <CloudDownloadOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoá bản backup">
                      <IconButton size="small" color="error" onClick={() => handleDeleteBackup(b)}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && backups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có bản backup nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

BackupHistoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  examDatabase: PropTypes.object,
  onChanged: PropTypes.func
};

export default BackupHistoryDialog;
