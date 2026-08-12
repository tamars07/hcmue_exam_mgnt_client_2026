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

// ==============================|| ROOMS - LIST ||============================== //

const emptyValues = { code: '', name: '', desc: '', no_slots: 0, organization_code: '', status: true };

const RoomsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getRooms({
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
    if (!window.confirm(`Xoá phòng thi "${row.name}"?`)) return;
    try {
      await councilMgmtService.deleteRoom(row.code);
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      if (editing) {
        await councilMgmtService.updateRoom(editing.code, values);
      } else {
        await councilMgmtService.createRoom(values);
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
    { field: 'code', headerName: 'Mã phòng', width: 120 },
    { field: 'name', headerName: 'Tên phòng', flex: 1, minWidth: 160 },
    { field: 'organization_code', headerName: 'Địa điểm thi', width: 150 },
    { field: 'no_slots', headerName: 'Số máy', width: 100, type: 'number' },
    { field: 'desc', headerName: 'Diễn giải', flex: 1, minWidth: 160 },
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
      title="Phòng thi"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm phòng thi
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
            name: Yup.string().max(50).required('Bắt buộc nhập tên'),
            no_slots: Yup.number().min(0).required('Bắt buộc nhập số máy'),
            organization_code: Yup.string().required('Bắt buộc chọn địa điểm thi')
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

export default RoomsPage;
