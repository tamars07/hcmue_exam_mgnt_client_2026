import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { EditOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';

// ==============================|| COUNCILS - LIST ||============================== //

const emptyValues = {
  code: '',
  desc: '',
  no_turns: 1,
  start_at: '',
  finish_at: '',
  organization_code: '',
  monitor_id: '',
  is_autostart: false,
  import_testdata_before_time: 60,
  status: true
};

const CouncilsPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
    // role_id = 7: điểm trưởng
    councilMgmtService
      .getLookup('monitors', { role: 7 })
      .then((res) => setMonitors(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getCouncils({
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

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      if (editing) {
        await councilMgmtService.updateCouncil(editing.code, values);
      } else {
        await councilMgmtService.createCouncil(values);
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
    { field: 'code', headerName: 'Mã HĐ thi', width: 140 },
    { field: 'desc', headerName: 'Diễn giải', flex: 1, minWidth: 160 },
    { field: 'organization_code', headerName: 'Điểm thi', width: 120 },
    { field: 'no_turns', headerName: 'Số ca thi', width: 100, type: 'number' },
    { field: 'start_at', headerName: 'Ngày BĐ', width: 120 },
    { field: 'finish_at', headerName: 'Ngày KT', width: 120 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
    },
    {
      field: 'actions',
      headerName: '',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Sửa">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quản trị ca thi">
            <IconButton size="small" onClick={() => navigate(`/council-mgmt/councils/${params.row.code}/turns`)}>
              <UnorderedListOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MainCard
      title="Hội đồng thi"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm hội đồng thi
        </Button>
      }
    >
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Tìm kiếm (mã / diễn giải)"
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
            no_turns: Yup.number().min(1).max(20).required('Bắt buộc nhập số ca thi'),
            start_at: Yup.date().required('Bắt buộc nhập ngày bắt đầu'),
            finish_at: Yup.date().min(Yup.ref('start_at'), 'Phải sau ngày bắt đầu').required('Bắt buộc nhập ngày kết thúc'),
            organization_code: Yup.string().required('Bắt buộc chọn điểm thi'),
            monitor_id: Yup.number().required('Bắt buộc chọn điểm trưởng')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa hội đồng thi' : 'Thêm hội đồng thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã HĐ thi"
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
                    label="Diễn giải"
                    name="desc"
                    value={values.desc || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <TextField
                    fullWidth
                    select
                    label="Điểm thi"
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
                    select
                    label="Điểm trưởng"
                    name="monitor_id"
                    value={values.monitor_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.monitor_id && errors.monitor_id)}
                    helperText={touched.monitor_id && errors.monitor_id}
                  >
                    {monitors.map((m) => (
                      <MenuItem key={m.code} value={m.id}>
                        {m.name} ({m.code})
                      </MenuItem>
                    ))}
                  </TextField>
                  {!editing && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Số ca thi"
                      name="no_turns"
                      value={values.no_turns}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.no_turns && errors.no_turns)}
                      helperText={touched.no_turns && errors.no_turns}
                    />
                  )}
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày bắt đầu"
                    name="start_at"
                    InputLabelProps={{ shrink: true }}
                    value={values.start_at ? String(values.start_at).slice(0, 10) : ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.start_at && errors.start_at)}
                    helperText={touched.start_at && errors.start_at}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    label="Ngày kết thúc"
                    name="finish_at"
                    InputLabelProps={{ shrink: true }}
                    value={values.finish_at ? String(values.finish_at).slice(0, 10) : ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.finish_at && errors.finish_at)}
                    helperText={touched.finish_at && errors.finish_at}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Cho phép nhập đề trước giờ thi (phút)"
                    name="import_testdata_before_time"
                    value={values.import_testdata_before_time}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <FormControlLabel
                    control={<Switch checked={!!values.is_autostart} onChange={(e) => setFieldValue('is_autostart', e.target.checked)} />}
                    label="Khởi tạo tự động"
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

export default CouncilsPage;
