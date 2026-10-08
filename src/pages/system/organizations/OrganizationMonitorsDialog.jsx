import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

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
  Divider,
  FormControlLabel,
  IconButton,
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
import { CheckCircleOutlined, DeleteOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useConfirm from 'hooks/useConfirm';

const emptyValues = { code: '', name: '' };

// ==============================|| ĐỊA ĐIỂM THI - POPUP TÀI KHOẢN ĐIỂM TRƯỞNG ||============================== //
// Gộp thay cho trang riêng "Cán bộ" (đã gỡ) — xem từng địa điểm 1, không cần chọn lại địa điểm qua bộ
// lọc. Mỗi địa điểm có thể có nhiều tài khoản điểm trưởng (đổi người phụ trách vẫn giữ lịch sử), chỉ
// đúng 1 tài khoản "đang active" tại 1 thời điểm — đây là tài khoản dùng khi tạo DB mới/đồng bộ.

const OrganizationMonitorsDialog = ({ open, organization, onClose }) => {
  const { withLoading } = useLoadingOverlay();
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [regenerateTarget, setRegenerateTarget] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const res = await systemAdminService.getMasterMonitors(organization.id);
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setAddFormOpen(false);
      fetchRows();
    }
  }, [open, fetchRows]);

  const handleActivate = async (row) => {
    try {
      await withLoading(() => systemAdminService.activateMasterMonitor(row.id), 'Đang cập nhật... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã đặt làm điểm trưởng chính', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleConfirmRegeneratePassword = async () => {
    const row = regenerateTarget;
    if (!row) return;
    try {
      const res = await withLoading(() => systemAdminService.regenerateMasterMonitorPassword(row.id), 'Đang sinh mật khẩu... Vui lòng chờ');
      setShowPassword(true);
      openSnackbar({
        open: true,
        message: `Mật khẩu mới cho "${row.code}": ${res.data.data.password}`,
        variant: 'alert',
        alert: { color: 'success' }
      });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setRegenerateTarget(null);
    }
  };

  const handleDelete = async (row) => {
    const ok = await confirm({ title: 'Xoá tài khoản', message: `Xoá tài khoản "${row.name}" (${row.code})?`, confirmText: 'Xoá', confirmColor: 'error' });
    if (!ok) return;
    try {
      await withLoading(() => systemAdminService.deleteMasterMonitor(row.id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleCreate = async (values, { setSubmitting, setErrors, resetForm }) => {
    try {
      const result = await withLoading(
        () => systemAdminService.createMasterMonitor({ ...values, master_organization_id: organization.id }),
        'Đang lưu... Vui lòng chờ'
      );
      const { monitor, password } = result.data.data;
      setShowPassword(true);
      openSnackbar({
        open: true,
        message: `Đã tạo tài khoản "${monitor.code}" — mật khẩu: ${password}`,
        variant: 'alert',
        alert: { color: 'success' }
      });
      resetForm();
      setAddFormOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tài khoản điểm trưởng — {organization?.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
              label="Hiện mật khẩu"
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<PlusOutlined />}
              onClick={() => setAddFormOpen((v) => !v)}
            >
              Thêm tài khoản điểm trưởng
            </Button>
          </Stack>

          {addFormOpen && (
            <Formik
              enableReinitialize
              initialValues={emptyValues}
              validationSchema={Yup.object().shape({
                code: Yup.string().max(50).required('Bắt buộc nhập tài khoản'),
                name: Yup.string().max(255).required('Bắt buộc nhập họ tên')
              })}
              onSubmit={handleCreate}
            >
              {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting }) => (
                <form noValidate onSubmit={submitForm}>
                  <Stack spacing={1.5} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <DialogContentText>
                      Tài khoản mới mặc định KHÔNG active — bấm “Đặt làm chính” sau khi tạo nếu muốn dùng ngay.
                    </DialogContentText>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Tài khoản"
                        name="code"
                        value={values.code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.code && errors.code)}
                        helperText={(touched.code && errors.code) || 'Không thể đổi lại sau khi tạo'}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Họ tên"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.name && errors.name)}
                        helperText={touched.name && errors.name}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setAddFormOpen(false)}>
                        Huỷ
                      </Button>
                      <Button size="small" type="submit" variant="contained" disabled={isSubmitting}>
                        Lưu
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              )}
            </Formik>
          )}

          <Divider />

          <Table size="small">
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
                        <IconButton size="small" onClick={() => setRegenerateTarget(row)}>
                          <RedoOutlined />
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
              {loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      Chưa có tài khoản điểm trưởng nào cho địa điểm này
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>

      <Dialog open={!!regenerateTarget} onClose={() => setRegenerateTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Sinh mật khẩu mới</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sinh mật khẩu mới cho tài khoản <strong>{regenerateTarget?.code}</strong>? Mật khẩu cũ sẽ không còn dùng được.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateTarget(null)}>Huỷ</Button>
          <Button variant="contained" color="warning" onClick={handleConfirmRegeneratePassword}>
            Sinh mật khẩu mới
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

OrganizationMonitorsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  organization: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
  onClose: PropTypes.func.isRequired
};

export default OrganizationMonitorsDialog;
