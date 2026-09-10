import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
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
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| KHO DỮ LIỆU DÙNG CHUNG - CÁN BỘ (ĐIỂM TRƯỞNG) ||============================== //
// Mỗi địa điểm thi có thể có nhiều tài khoản điểm trưởng (đổi người phụ trách vẫn giữ lịch sử), nhưng
// chỉ đúng 1 tài khoản "đang active" tại 1 thời điểm — đây là tài khoản được dùng khi tạo DB mới/đồng
// bộ. Tạo tự động khi thêm Địa điểm thi mới (trang Địa điểm thi) — trang này chỉ thêm tài khoản KHÁC
// cho 1 địa điểm đã có (vd đổi người phụ trách) và chọn tài khoản nào sẽ active.

const emptyValues = { master_organization_id: '', code: '', name: '' };

const MonitorsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [organizations, setOrganizations] = useState([]);
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [passwordDialog, setPasswordDialog] = useState(null);

  useEffect(() => {
    systemAdminService
      .getMasterOrganizations()
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemAdminService.getMasterMonitors(organizationFilter || undefined);
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [organizationFilter]);

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
    if (!window.confirm(`Xoá tài khoản "${row.name}" (${row.code})?`)) return;
    try {
      await withLoading(() => systemAdminService.deleteMasterMonitor(row.id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleActivate = async (row) => {
    try {
      await withLoading(() => systemAdminService.activateMasterMonitor(row.id), 'Đang cập nhật... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã đặt làm điểm trưởng chính', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleRegeneratePassword = async (row) => {
    if (!window.confirm(`Sinh mật khẩu mới cho tài khoản "${row.code}"? Mật khẩu cũ sẽ không còn dùng được.`)) return;
    try {
      const res = await withLoading(() => systemAdminService.regenerateMasterMonitorPassword(row.id), 'Đang sinh mật khẩu... Vui lòng chờ');
      setPasswordDialog({ code: row.code, password: res.data.data.password });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const result = await withLoading(async () => {
        if (editing) {
          return systemAdminService.updateMasterMonitor(editing.id, values);
        }
        return systemAdminService.createMasterMonitor(values);
      }, 'Đang lưu... Vui lòng chờ');

      if (!editing) {
        const { monitor, password } = result.data.data;
        setPasswordDialog({ code: monitor.code, password });
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

  return (
    <MainCard
      title="Cán bộ (Điểm trưởng)"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm tài khoản
        </Button>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Địa điểm thi"
            value={organizationFilter}
            onChange={(e) => setOrganizationFilter(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Tất cả địa điểm</MenuItem>
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.code} - {org.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
            label="Hiện mật khẩu"
          />
        </Stack>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Địa điểm thi</TableCell>
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
                <TableCell>{row.organization?.code}</TableCell>
                <TableCell>{row.code}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{showPassword ? row.password : '••••••••'}</TableCell>
                <TableCell>
                  {row.is_active ? <Chip label="Đang active" color="success" size="small" /> : <Chip label="Không active" size="small" />}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {!row.is_active && (
                      <Tooltip title="Đặt làm điểm trưởng chính">
                        <IconButton size="small" color="success" onClick={() => handleActivate(row)}>
                          <CheckCircleOutlined />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Sinh mật khẩu mới">
                      <IconButton size="small" onClick={() => handleRegeneratePassword(row)}>
                        <RedoOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sửa">
                      <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={row.is_active ? 'Đặt tài khoản khác làm chính trước khi xoá' : 'Xoá'}>
                      <span>
                        <IconButton size="small" color="error" disabled={row.is_active} onClick={() => handleDelete(row)}>
                          <DeleteOutlined />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có tài khoản điểm trưởng nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            master_organization_id: Yup.number().required('Bắt buộc chọn địa điểm thi'),
            code: Yup.string().max(50).required('Bắt buộc nhập tài khoản'),
            name: Yup.string().max(255).required('Bắt buộc nhập họ tên')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa tài khoản điểm trưởng' : 'Thêm tài khoản điểm trưởng'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {!editing && (
                    <DialogContentText>
                      Tài khoản mới sẽ mặc định KHÔNG active — bấm “Đặt làm điểm trưởng chính” sau khi tạo nếu muốn dùng ngay.
                    </DialogContentText>
                  )}
                  <TextField
                    fullWidth
                    select
                    label="Địa điểm thi"
                    name="master_organization_id"
                    value={values.master_organization_id}
                    onChange={(e) => setFieldValue('master_organization_id', e.target.value)}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    error={Boolean(touched.master_organization_id && errors.master_organization_id)}
                    helperText={touched.master_organization_id && errors.master_organization_id}
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>
                        {org.code} - {org.name}
                      </MenuItem>
                    ))}
                  </TextField>
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
        <DialogTitle>Mật khẩu tài khoản</DialogTitle>
        <DialogContent>
          <DialogContentText>Lưu lại mật khẩu này — có thể xem lại sau bằng cách bật “Hiện mật khẩu”.</DialogContentText>
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
    </MainCard>
  );
};

export default MonitorsPage;
