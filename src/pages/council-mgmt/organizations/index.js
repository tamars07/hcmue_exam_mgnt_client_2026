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

// ==============================|| ORGANIZATIONS - LIST ||============================== //

const emptyValues = { code: '', name: '', address: '', status: true };

const OrganizationsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getOrganizations({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        search
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search]);

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
    if (!window.confirm(`Xoá địa điểm thi "${row.name}"?`)) return;
    try {
      await councilMgmtService.deleteOrganization(row.code);
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      if (editing) {
        await councilMgmtService.updateOrganization(editing.code, values);
      } else {
        await councilMgmtService.createOrganization(values);
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

  const columns = [
    { field: 'code', headerName: 'Mã', width: 120 },
    { field: 'name', headerName: 'Tên', flex: 1, minWidth: 200 },
    { field: 'address', headerName: 'Địa chỉ', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
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
      title="Địa điểm thi"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm địa điểm thi
        </Button>
      }
    >
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Tìm kiếm (mã / tên)"
          value={search}
          onChange={(e) => {
            setPaginationModel((m) => ({ ...m, page: 0 }));
            setSearch(e.target.value);
          }}
          sx={{ maxWidth: 320 }}
        />
        <DataGrid
          autoHeight
          rows={rows}
          getRowId={(row) => row.code}
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
            code: Yup.string().max(50).required('Bắt buộc nhập mã'),
            name: Yup.string().max(255).required('Bắt buộc nhập tên'),
            address: Yup.string().nullable()
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa địa điểm thi' : 'Thêm địa điểm thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
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
                  <FormControlLabel
                    control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                    label="Sử dụng"
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

export default OrganizationsPage;
