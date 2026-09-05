import { useEffect, useState, useCallback } from 'react';

// material-ui
import {
  Alert,
  Box,
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
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useAuth from 'hooks/useAuth';
import useSubjects from 'hooks/useSubjects';

// ==============================|| QUẢN LÝ TÀI KHOẢN CÁN BỘ (ĐIỂM TRƯỞNG/GIÁM THỊ/GIÁM KHẢO) ||============================== //

const emptyValues = { code: '', name: '', password: '', role_id: '', organization_code: '', subject_id: '', status: true };

const ROLE_CHIP_COLOR = { CHAIRMAN: 'warning', MONITOR: 'success', EXAMINER: 'info' };

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

const MonitorsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('ADMIN'));
  const subjects = useSubjects();
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    councilMgmtService
      .getLookup('staff_roles')
      .then((res) => setRoles(res.data.data))
      .catch(() => {});
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const roleNameById = (roleId) => roles.find((r) => r.id === roleId)?.name;

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
    const roleName = roleNameById(values.role_id);
    const payload = {
      ...values,
      organization_code: roleName === 'EXAMINER' ? undefined : values.organization_code,
      subject_id: roleName === 'EXAMINER' ? values.subject_id : undefined
    };
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

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Bắt buộc nhập họ tên';
    if (!editing) {
      if (!values.code) errors.code = 'Bắt buộc nhập tài khoản';
      if (!values.password) errors.password = 'Bắt buộc nhập mật khẩu';
    }
    if (values.password && values.password.length < 4) errors.password = 'Tối thiểu 4 ký tự';
    if (!values.role_id) errors.role_id = 'Bắt buộc chọn vai trò';

    const roleName = roleNameById(values.role_id);
    if (roleName === 'EXAMINER') {
      if (!values.subject_id) errors.subject_id = 'Bắt buộc chọn môn thi';
    } else if (roleName && !values.organization_code) {
      errors.organization_code = 'Bắt buộc chọn địa điểm thi';
    }

    return errors;
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await councilMgmtService.downloadMonitorImportTemplate();
      downloadBlob(res.data, 'Mau_import_tai_khoan_can_bo.xlsx');
    } catch (e) {
      openSnackbar({ open: true, message: 'Tải file mẫu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const res = await withLoading(() => councilMgmtService.importMonitors(file), 'Đang import... Vui lòng chờ');
      setImportResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const columns = [
    { field: 'code', headerName: 'Tài khoản', width: 140 },
    { field: 'name', headerName: 'Họ tên', flex: 1, minWidth: 180 },
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
      width: 200,
      renderCell: (params) => <Chip label={params.value} size="small" color={ROLE_CHIP_COLOR[params.row.role_name] || 'default'} />
    },
    {
      field: 'location_or_subject',
      headerName: 'Địa điểm thi / Môn thi',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => (row.role_name === 'EXAMINER' ? row.subject_name : row.organization_name)
    },
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
      title="Tài khoản cán bộ"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>
          <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                handleImport(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
            Thêm tài khoản
          </Button>
        </Stack>
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
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {roles.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          {isAdmin && (
            <FormControlLabel
              control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
              label="Hiện mật khẩu"
            />
          )}
        </Stack>

        {importResult && (
          <Alert severity={importResult.errors?.length ? 'warning' : 'success'} onClose={() => setImportResult(null)}>
            Đã tạo {importResult.created_count} tài khoản.
            {importResult.errors?.length > 0 && (
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}

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
        <Formik enableReinitialize initialValues={editing || emptyValues} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => {
            const roleName = roleNameById(values.role_id);

            return (
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
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {roleName === 'EXAMINER' ? (
                      <TextField
                        fullWidth
                        select
                        label="Môn thi"
                        name="subject_id"
                        value={values.subject_id}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.subject_id && errors.subject_id)}
                        helperText={touched.subject_id && errors.subject_id}
                      >
                        {subjects.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        select
                        label="Địa điểm thi"
                        name="organization_code"
                        value={values.organization_code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!roleName}
                        error={Boolean(touched.organization_code && errors.organization_code)}
                        helperText={touched.organization_code && errors.organization_code}
                      >
                        {organizations.map((org) => (
                          <MenuItem key={org.code} value={org.code}>
                            {org.code} - {org.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
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
            );
          }}
        </Formik>
      </Dialog>
    </MainCard>
  );
};

export default MonitorsPage;
