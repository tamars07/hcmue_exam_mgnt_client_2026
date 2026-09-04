import { useEffect, useState, useCallback } from 'react';

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
  TextField,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useAuth from 'hooks/useAuth';

// ==============================|| TÀI KHOẢN CÁN BỘ COI THI / ĐIỂM TRƯỞNG - LIST ||============================== //

const emptyValues = { code: '', name: '', password: '', role_id: 4, organization_code: '', status: true };

const MonitorsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('ADMIN'));
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getMonitors({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        search,
        role_id: roleFilter || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, roleFilter]);

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
    if (!window.confirm(`Xoá tài khoản "${row.name}" (${row.code})?`)) return;
    try {
      await withLoading(() => councilMgmtService.deleteMonitor(row.id), 'Đang xoá tài khoản... Vui lòng chờ');
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
          await councilMgmtService.updateMonitor(editing.id, payload);
        } else {
          await councilMgmtService.createMonitor(payload);
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

  const columns = [
    { field: 'code', headerName: 'Tài khoản', width: 160 },
    { field: 'name', headerName: 'Họ tên', flex: 1, minWidth: 200 },
    ...(isAdmin
      ? [
          {
            field: 'password',
            headerName: 'Mật khẩu',
            width: 120,
            sortable: false,
            renderCell: ({ value }) => (showPassword ? value : '••••••••')
          }
        ]
      : []),
    {
      field: 'role_label',
      headerName: 'Vai trò',
      width: 140,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.row.role_id === 7 ? 'primary' : 'default'} />
    },
    { field: 'organization_name', headerName: 'Địa điểm thi', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => <Chip label={params.value ? 'Hoạt động' : 'Khoá'} color={params.value ? 'success' : 'default'} size="small" />
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Sửa">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MainCard
      title="Cán bộ coi thi & Điểm trưởng"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm tài khoản
        </Button>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          <TextField
            size="small"
            label="Tìm kiếm (tài khoản / họ tên)"
            value={search}
            onChange={(e) => {
              setPaginationModel((m) => ({ ...m, page: 0 }));
              setSearch(e.target.value);
            }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            select
            size="small"
            label="Vai trò"
            value={roleFilter}
            onChange={(e) => {
              setPaginationModel((m) => ({ ...m, page: 0 }));
              setRoleFilter(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value={4}>Cán bộ coi thi</MenuItem>
            <MenuItem value={7}>Điểm trưởng</MenuItem>
          </TextField>
          {isAdmin && (
            <FormControlLabel
              control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
              label="Hiện mật khẩu"
            />
          )}
        </Stack>
        <DataGrid
          autoHeight
          rows={rows}
          getRowId={(row) => row.id}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập tài khoản'),
            name: Yup.string().max(255).required('Bắt buộc nhập họ tên'),
            password: editing
              ? Yup.string().min(4, 'Tối thiểu 4 ký tự')
              : Yup.string().min(4, 'Tối thiểu 4 ký tự').required('Bắt buộc nhập mật khẩu'),
            role_id: Yup.number().required('Bắt buộc chọn vai trò'),
            organization_code: Yup.string().required('Bắt buộc chọn địa điểm thi')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa tài khoản' : 'Thêm tài khoản'}</DialogTitle>
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
                  <TextField
                    fullWidth
                    select
                    label="Vai trò"
                    name="role_id"
                    value={values.role_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.role_id && errors.role_id)}
                    helperText={touched.role_id && errors.role_id}
                  >
                    <MenuItem value={4}>Cán bộ coi thi (giám thị)</MenuItem>
                    <MenuItem value={7}>Điểm trưởng</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    select
                    label="Địa điểm thi"
                    name="organization_code"
                    value={values.organization_code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.organization_code && errors.organization_code)}
                    helperText={touched.organization_code && errors.organization_code}
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.code} value={org.code}>
                        {org.code} - {org.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <FormControlLabel
                    control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                    label="Hoạt động"
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
    </MainCard>
  );
};

export default MonitorsPage;
