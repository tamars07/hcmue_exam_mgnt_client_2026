import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| SUPER ADMIN - TÀI KHOẢN ADMIN CỦA TỪNG DB KỲ THI ||============================== //
// Chọn 1 DB bất kỳ trong danh mục để quản lý tài khoản ADMIN của riêng DB đó — KHÔNG cần đặt DB đó làm
// active của toàn hệ thống (khác hẳn "Chọn dùng" ở trang Danh sách database kỳ thi).

const emptyValues = { code: '', name: '', password: '', status: true };

const AdminAccountsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [databases, setDatabases] = useState([]);
  const [selectedDbId, setSelectedDbId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    systemAdminService
      .getExamDatabases()
      .then((res) => setDatabases(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    if (!selectedDbId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await systemAdminService.getAdminAccounts(selectedDbId);
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [selectedDbId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing({ ...row, password: '' });
    setDialogOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá tài khoản ADMIN "${row.name}" (${row.code}) của database này?`)) return;
    try {
      await withLoading(() => systemAdminService.deleteAdminAccount(selectedDbId, row.id), 'Đang xoá tài khoản... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    const payload = { ...values };
    if (editing && !payload.password) delete payload.password;

    try {
      await withLoading(async () => {
        if (editing) {
          await systemAdminService.updateAdminAccount(selectedDbId, editing.id, payload);
        } else {
          await systemAdminService.createAdminAccount(selectedDbId, payload);
        }
      }, 'Đang lưu tài khoản... Vui lòng chờ');
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

  const validate = (values) => {
    const errors = {};
    if (!editing && !values.code) errors.code = 'Bắt buộc nhập tài khoản';
    if (!values.name) errors.name = 'Bắt buộc nhập họ tên';
    if (!editing && !values.password) errors.password = 'Bắt buộc nhập mật khẩu';
    if (values.password && values.password.length < 4) errors.password = 'Tối thiểu 4 ký tự';
    return errors;
  };

  return (
    <MainCard
      title="Tài khoản ADMIN"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate} disabled={!selectedDbId}>
          Thêm tài khoản
        </Button>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Database kỳ thi"
            value={selectedDbId}
            onChange={(e) => setSelectedDbId(e.target.value)}
            sx={{ minWidth: 320 }}
            helperText="Chọn 1 database bất kỳ trong danh mục — không cần đặt làm database đang active"
          >
            <MenuItem value="">-- Chọn database --</MenuItem>
            {databases.map((db) => (
              <MenuItem key={db.id} value={db.id}>
                {db.label} ({db.db_name}){db.is_active ? ' — đang active' : ''}
              </MenuItem>
            ))}
          </TextField>
          {selectedDbId && (
            <FormControlLabel
              control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
              label="Hiện mật khẩu"
            />
          )}
        </Stack>

        {!selectedDbId ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn 1 database kỳ thi ở trên để xem/quản lý tài khoản ADMIN của database đó
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tài khoản</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Mật khẩu</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{showPassword ? row.password : '••••••••'}</TableCell>
                  <TableCell>
                    <Chip label={row.status ? 'Hoạt động' : 'Khoá'} color={row.status ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      Database này chưa có tài khoản ADMIN nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik enableReinitialize initialValues={editing || emptyValues} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa tài khoản ADMIN' : 'Thêm tài khoản ADMIN'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Tài khoản"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    error={Boolean(touched.code && errors.code)}
                    helperText={(touched.code && errors.code) || (!editing && 'Không thể đổi lại sau khi tạo')}
                  />
                  <TextField
                    fullWidth
                    label="Họ tên"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.name && errors.name)}
                    helperText={touched.name && errors.name}
                  />
                  <TextField
                    fullWidth
                    label="Mật khẩu"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.password && errors.password)}
                    helperText={(touched.password && errors.password) || (editing && 'Để trống nếu không đổi mật khẩu')}
                  />
                  {editing && (
                    <FormControlLabel
                      control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                      label="Hoạt động"
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
    </MainCard>
  );
};

export default AdminAccountsPage;
