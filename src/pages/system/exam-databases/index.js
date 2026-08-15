import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ImportOutlined,
  InboxOutlined,
  LoginOutlined
} from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import CreateDatabaseDialog from './CreateDatabaseDialog';
import BackupHistoryDialog from './BackupHistoryDialog';
import SqlImportDialog from './SqlImportDialog';
import DeleteDatabaseDialog from './DeleteDatabaseDialog';

// ==============================|| SUPER ADMIN - QUẢN LÝ DATABASE KỲ THI ||============================== //

const ExamDatabasesPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withArchived, setWithArchived] = useState(false);
  const [allBackups, setAllBackups] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [backupTarget, setBackupTarget] = useState(null);
  const [importTarget, setImportTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectTarget, setSelectTarget] = useState(null);
  const [selecting, setSelecting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemAdminService.getExamDatabases(withArchived);
      const databases = res.data.data;
      setRows(databases);

      const backupLists = await Promise.all(
        databases.map((db) =>
          systemAdminService
            .getBackups(db.id)
            .then((r) => r.data.data.map((b) => ({ ...b, db_label: db.label, exam_database_id: db.id })))
            .catch(() => [])
        )
      );
      setAllBackups(backupLists.flat());
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách database', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [withArchived]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleArchiveToggle = async (row) => {
    try {
      if (row.status === 'archived') {
        await withLoading(() => systemAdminService.unarchiveExamDatabase(row.id), 'Đang bỏ lưu trữ database... Vui lòng chờ');
        openSnackbar({ open: true, message: 'Đã bỏ lưu trữ', variant: 'alert', alert: { color: 'success' } });
      } else {
        await withLoading(() => systemAdminService.archiveExamDatabase(row.id), 'Đang lưu trữ database... Vui lòng chờ');
        openSnackbar({ open: true, message: 'Đã lưu trữ', variant: 'alert', alert: { color: 'success' } });
      }
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleConfirmSelect = async () => {
    if (!selectTarget) return;
    setSelecting(true);
    try {
      await withLoading(
        () => systemAdminService.selectExamDatabase(selectTarget.id),
        `Đang chuyển sang database "${selectTarget.label}"... Vui lòng chờ`
      );
      openSnackbar({
        open: true,
        message: `Đã chuyển kỳ thi đang hoạt động sang "${selectTarget.label}"`,
        variant: 'alert',
        alert: { color: 'success' }
      });
      setSelectTarget(null);
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Chọn database thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSelecting(false);
    }
  };

  return (
    <MainCard
      title="Danh sách database kỳ thi"
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch checked={withArchived} onChange={(e) => setWithArchived(e.target.checked)} />}
            label="Hiện cả DB đã lưu trữ"
          />
          <Button
            variant="outlined"
            startIcon={<LoginOutlined />}
            component="a"
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            Quản lý Hội đồng thi
          </Button>
          <Button variant="contained" startIcon={<DatabaseOutlined />} onClick={() => setCreateOpen(true)}>
            Thêm mới DB
          </Button>
        </Stack>
      }
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên hiển thị</TableCell>
            <TableCell>Tên database</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Backup gần nhất</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={row.is_active ? { bgcolor: 'success.lighter' } : undefined}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{row.db_name}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  {row.is_active && <Chip label="Đang sử dụng" color="success" size="small" icon={<CheckCircleOutlined />} />}
                  {row.status === 'archived' && <Chip label="Đã lưu trữ" size="small" />}
                </Stack>
              </TableCell>
              <TableCell>{row.last_backup_at ? new Date(row.last_backup_at).toLocaleString('vi-VN') : '—'}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  <Button size="small" variant="outlined" disabled={row.is_active || row.status === 'archived'} onClick={() => setSelectTarget(row)}>
                    Chọn dùng
                  </Button>
                  <Button size="small" startIcon={<CloudUploadOutlined />} onClick={() => setBackupTarget(row)}>
                    Backup
                  </Button>
                  <Button size="small" startIcon={<ImportOutlined />} onClick={() => setImportTarget(row)}>
                    Import theo bảng
                  </Button>
                  <Button size="small" startIcon={<InboxOutlined />} onClick={() => handleArchiveToggle(row)}>
                    {row.status === 'archived' ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                  </Button>
                  {!row.is_active && (
                    <Button size="small" color="error" startIcon={<DeleteOutlined />} onClick={() => setDeleteTarget(row)}>
                      Xoá hẳn
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có database kỳ thi nào trong danh mục
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CreateDatabaseDialog open={createOpen} onClose={() => setCreateOpen(false)} allBackups={allBackups} onCreated={fetchRows} />
      <BackupHistoryDialog open={!!backupTarget} onClose={() => setBackupTarget(null)} examDatabase={backupTarget} onChanged={fetchRows} />
      <SqlImportDialog open={!!importTarget} onClose={() => setImportTarget(null)} examDatabase={importTarget} />
      <DeleteDatabaseDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} examDatabase={deleteTarget} onDeleted={fetchRows} />

      <Dialog open={!!selectTarget} onClose={() => setSelectTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Xác nhận chuyển database đang sử dụng</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Thao tác này ảnh hưởng đến <strong>toàn bộ hệ thống</strong> — mọi người dùng khác đang thao tác trên kỳ thi hiện tại sẽ
              chuyển sang làm việc với database <strong>{selectTarget?.label}</strong> ({selectTarget?.db_name}) ngay lập tức.
            </Alert>
            <Typography variant="body2">
              Sau khi chọn xong, hãy đăng nhập lại bằng tài khoản ADMIN quản lý hội đồng thi của database này tại{' '}
              <RouterLink to="/login">trang đăng nhập</RouterLink> để tiếp tục quản lý hội đồng thi.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectTarget(null)}>Huỷ</Button>
          <Button variant="contained" disabled={selecting} onClick={handleConfirmSelect}>
            {selecting ? 'Đang chuyển...' : 'Xác nhận chọn'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default ExamDatabasesPage;
