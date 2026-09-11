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
  InputAdornment,
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
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| KHO DỮ LIỆU DÙNG CHUNG - PHÒNG THI ||============================== //
// Mã phòng luôn có tiền tố "<mã địa điểm thi>." — người dùng chỉ nhập phần hậu tố, backend tự ghép.

const emptyValues = { suffix: '', name: '', no_slots: 0, desc: '', status: true };

const RoomsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    systemAdminService
      .getMasterOrganizations()
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    if (!organizationId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await systemAdminService.getMasterRooms(organizationId);
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const selectedOrganization = organizations.find((o) => o.id === organizationId);

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const res = await withLoading(() => systemAdminService.importMasterRooms(organizationId, file), 'Đang import... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    const suffix = selectedOrganization ? row.code.replace(`${selectedOrganization.code}.`, '') : row.code;
    setEditing({ ...row, suffix });
    setDialogOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xoá phòng thi "${row.name}" (${row.code})?`)) return;
    try {
      await withLoading(() => systemAdminService.deleteMasterRoom(row.id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      await withLoading(async () => {
        if (editing) {
          await systemAdminService.updateMasterRoom(editing.id, values);
        } else {
          await systemAdminService.createMasterRoom({ ...values, master_organization_id: organizationId });
        }
      }, 'Đang lưu... Vui lòng chờ');
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
      title="Phòng thi"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button component="label" variant="outlined" startIcon={<UploadOutlined />} disabled={!organizationId}>
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
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate} disabled={!organizationId}>
            Thêm phòng thi
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <TextField
          select
          size="small"
          label="Địa điểm thi"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          sx={{ minWidth: 320 }}
        >
          <MenuItem value="">-- Chọn địa điểm thi --</MenuItem>
          {organizations.map((org) => (
            <MenuItem key={org.id} value={org.id}>
              {org.code} - {org.name}
            </MenuItem>
          ))}
        </TextField>

        {!organizationId ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn 1 địa điểm thi ở trên để xem/quản lý phòng thi của địa điểm đó
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã phòng</TableCell>
                <TableCell>Tên phòng</TableCell>
                <TableCell>Số máy</TableCell>
                <TableCell>Diễn giải</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.no_slots}</TableCell>
                  <TableCell>{row.desc || '—'}</TableCell>
                  <TableCell>
                    <Chip label={row.status ? 'Sử dụng' : 'Ẩn'} color={row.status ? 'success' : 'default'} size="small" />
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
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Địa điểm này chưa có phòng thi nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            suffix: Yup.string().max(50).required('Bắt buộc nhập mã phòng'),
            name: Yup.string().max(255).required('Bắt buộc nhập tên'),
            no_slots: Yup.number().min(0).required('Bắt buộc nhập số máy')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa phòng thi' : 'Thêm phòng thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã phòng"
                    name="suffix"
                    value={values.suffix}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{selectedOrganization?.code}.</InputAdornment>
                    }}
                    error={Boolean(touched.suffix && errors.suffix)}
                    helperText={touched.suffix && errors.suffix}
                  />
                  <TextField
                    fullWidth
                    label="Tên phòng"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.name && errors.name)}
                    helperText={touched.name && errors.name}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Số máy"
                    name="no_slots"
                    value={values.no_slots}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.no_slots && errors.no_slots)}
                    helperText={touched.no_slots && errors.no_slots}
                  />
                  <TextField
                    fullWidth
                    label="Diễn giải"
                    name="desc"
                    value={values.desc || ''}
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
    </MainCard>
  );
};

export default RoomsPage;
