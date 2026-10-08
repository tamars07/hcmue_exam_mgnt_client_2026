import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, SyncOutlined, TeamOutlined, UploadOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useConfirm from 'hooks/useConfirm';
import OrganizationMonitorsDialog from './OrganizationMonitorsDialog';

// ==============================|| KHO DỮ LIỆU DÙNG CHUNG - ĐỊA ĐIỂM THI ||============================== //
// Nguồn duy nhất cho Địa điểm thi/Phòng thi/Điểm trưởng của mọi DB kỳ thi — thêm/sửa/xoá ở đây, rồi
// "Đồng bộ" sang 1 DB cụ thể (hoặc chọn lúc tạo DB mới ở trang Cấu hình database). council-mgmt (Tổ
// chức thi) chỉ còn xem, không sửa được nữa, tránh sai lệch dữ liệu giữa các DB.

const emptyValues = { code: '', name: '', address: '', status: true };

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const OrganizationsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [passwordDialog, setPasswordDialog] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [monitorsTarget, setMonitorsTarget] = useState(null);

  const [syncTarget, setSyncTarget] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [syncDbId, setSyncDbId] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemAdminService.getMasterOrganizations();
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Xoá địa điểm thi',
      message: `Xoá địa điểm thi "${row.name}"? Toàn bộ phòng thi + tài khoản điểm trưởng thuộc địa điểm này cũng sẽ bị xoá khỏi kho dùng chung (không ảnh hưởng dữ liệu đã đồng bộ vào các DB kỳ thi trước đó).`,
      confirmText: 'Xoá',
      confirmColor: 'error'
    });
    if (!ok) return;
    try {
      await withLoading(() => systemAdminService.deleteMasterOrganization(row.id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const result = await withLoading(async () => {
        if (editing) {
          return systemAdminService.updateMasterOrganization(editing.id, values);
        }
        return systemAdminService.createMasterOrganization(values);
      }, 'Đang lưu... Vui lòng chờ');

      if (!editing) {
        const { organization, chairman_password: chairmanPassword } = result.data.data;
        setPasswordDialog({ code: organization.code, password: chairmanPassword });
      }
      openSnackbar({ open: true, message: 'Lưu thành công', variant: 'alert', alert: { color: 'success' } });
      setDialogOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await systemAdminService.downloadMasterOrganizationImportTemplate();
      downloadBlob(res.data, 'Mau_import_dia_diem_thi.xlsx');
    } catch (e) {
      openSnackbar({ open: true, message: 'Tải file mẫu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const res = await withLoading(() => systemAdminService.importMasterOrganizations(file), 'Đang import... Vui lòng chờ');
      setImportResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleExport = async () => {
    try {
      const res = await withLoading(() => systemAdminService.exportMasterOrganizations(), 'Đang xuất file... Vui lòng chờ');
      downloadBlob(res.data, `Dia_diem_thi_${Date.now()}.xlsx`);
    } catch (e) {
      openSnackbar({ open: true, message: 'Xuất file thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleOpenSync = (row) => {
    setSyncTarget(row);
    setSyncDbId('');
    if (databases.length === 0) {
      systemAdminService
        .getExamDatabases()
        .then((res) => setDatabases(res.data.data))
        .catch(() => {});
    }
  };

  const handleSync = async () => {
    if (!syncDbId) return;
    try {
      await withLoading(() => systemAdminService.syncMasterData(syncDbId, [syncTarget.id]), 'Đang đồng bộ... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã đồng bộ dữ liệu dùng chung', variant: 'alert', alert: { color: 'success' } });
      setSyncTarget(null);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Đồng bộ thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <MainCard
      title="Địa điểm thi"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                handleImport(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
            Thêm địa điểm thi
          </Button>
        </Stack>
      }
    >
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Địa chỉ</TableCell>
            <TableCell>Phòng thi</TableCell>
            <TableCell>Điểm trưởng</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.address || '—'}</TableCell>
              <TableCell>{row.rooms_count}</TableCell>
              <TableCell>{row.monitors_count}</TableCell>
              <TableCell>
                <Chip label={row.status ? 'Sử dụng' : 'Ẩn'} color={row.status ? 'success' : 'default'} size="small" />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Tài khoản điểm trưởng">
                    <IconButton size="small" onClick={() => setMonitorsTarget(row)}>
                      <TeamOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Đồng bộ vào 1 DB kỳ thi">
                    <IconButton size="small" onClick={() => handleOpenSync(row)}>
                      <SyncOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xoá">
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          )}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có địa điểm thi nào trong kho dữ liệu dùng chung
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập mã'),
            name: Yup.string().max(255).required('Bắt buộc nhập tên')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa địa điểm thi' : 'Thêm địa điểm thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {!editing && (
                    <DialogContentText>
                      Tạo mới sẽ tự động sinh kèm 1 tài khoản điểm trưởng (mật khẩu ngẫu nhiên) cho địa điểm này.
                    </DialogContentText>
                  )}
                  <TextField
                    fullWidth
                    label="Mã"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    error={Boolean(touched.code && errors.code)}
                    helperText={touched.code && errors.code}
                  />
                  <TextField
                    fullWidth
                    label="Tên"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.name && errors.name)}
                    helperText={touched.name && errors.name}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Địa chỉ"
                    name="address"
                    value={values.address || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {editing && (
                    <FormControlLabel
                      control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                      label="Sử dụng"
                    />
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Huỷ</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Lưu
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      <Dialog open={!!passwordDialog} onClose={() => setPasswordDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Đã tạo tài khoản điểm trưởng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tài khoản điểm trưởng cho địa điểm <strong>{passwordDialog?.code}</strong> — lưu lại mật khẩu này, có thể xem lại sau bằng nút
            “Tài khoản điểm trưởng” trên dòng địa điểm đó.
          </DialogContentText>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField label="Tài khoản" value={passwordDialog?.code || ''} InputProps={{ readOnly: true }} fullWidth />
            <TextField label="Mật khẩu" value={passwordDialog?.password || ''} InputProps={{ readOnly: true }} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setPasswordDialog(null)}>
            Đã lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!importResult} onClose={() => setImportResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Kết quả import địa điểm thi</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {importResult?.created?.length > 0 ? (
              <>
                <DialogContentText>
                  Đã tạo {importResult.created.length} địa điểm thi, kèm tài khoản điểm trưởng — lưu lại mật khẩu ngay, có thể xem lại
                  sau bằng nút “Tài khoản điểm trưởng” trên dòng địa điểm đó.
                </DialogContentText>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Địa điểm</TableCell>
                      <TableCell>Tài khoản điểm trưởng</TableCell>
                      <TableCell>Mật khẩu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importResult.created.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell>
                          {row.code} - {row.name}
                        </TableCell>
                        <TableCell>{row.chairman_code}</TableCell>
                        <TableCell>{row.chairman_password}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <DialogContentText>Không có địa điểm thi nào được tạo mới.</DialogContentText>
            )}
            {importResult?.errors?.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="body2" color="error.main">
                  {importResult.errors.length} dòng lỗi, không được import:
                </Typography>
                {importResult.errors.map((err) => (
                  <Typography key={err.row_number} variant="body2" color="error.main">
                    Dòng {err.row_number}: {err.reasons.join('; ')}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setImportResult(null)}>
            Đã lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!syncTarget} onClose={() => setSyncTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Đồng bộ “{syncTarget?.name}”</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Chọn 1 DB kỳ thi để ghi đè lại Địa điểm thi/Phòng thi/tài khoản điểm trưởng (đang active) cho khớp với kho dùng chung. Chỉ
            thêm/cập nhật, không xoá dữ liệu đã có trong DB đích.
          </DialogContentText>
          <TextField select fullWidth label="Database kỳ thi" value={syncDbId} onChange={(e) => setSyncDbId(e.target.value)}>
            <MenuItem value="">-- Chọn database --</MenuItem>
            {databases.map((db) => (
              <MenuItem key={db.id} value={db.id}>
                {db.label} ({db.db_name}){db.is_active ? ' — đang active' : ''}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncTarget(null)}>Huỷ</Button>
          <Button variant="contained" disabled={!syncDbId} onClick={handleSync}>
            Đồng bộ
          </Button>
        </DialogActions>
      </Dialog>

      <OrganizationMonitorsDialog
        open={!!monitorsTarget}
        organization={monitorsTarget}
        onClose={() => {
          setMonitorsTarget(null);
          fetchRows();
        }}
      />
    </MainCard>
  );
};

export default OrganizationsPage;
