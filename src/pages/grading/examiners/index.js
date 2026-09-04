import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

// ==============================|| B4 - TÀI KHOẢN GIÁM KHẢO ||============================== //

const emptyValues = { code: '', name: '', password: '', subject_id: '' };

const ExaminersPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradingService.getExaminers({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        subject_id: subjectFilter || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, subjectFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const res = await withLoading(() => gradingService.createExaminer(values), 'Đang tạo tài khoản... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setDialogOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Tạo tài khoản thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const res = await withLoading(() => gradingService.importExaminers(file), 'Đang import... Vui lòng chờ');
      setImportResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const columns = [
    { field: 'code', headerName: 'Tài khoản', width: 160 },
    { field: 'name', headerName: 'Họ tên', flex: 1, minWidth: 200 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 160,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    {
      field: 'password',
      headerName: 'Mật khẩu',
      width: 140,
      sortable: false,
      renderCell: ({ value }) => (showPassword ? value : '••••••••')
    }
  ];

  return (
    <MainCard
      title="Tài khoản giám khảo"
      secondary={
        <Stack direction="row" spacing={1}>
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
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setDialogOpen(true)}>
            Thêm tài khoản
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Môn thi"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            sx={{ maxWidth: 240 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Switch checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />}
            label="Hiện mật khẩu"
          />
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
        <Formik
          initialValues={emptyValues}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập tài khoản'),
            name: Yup.string().max(255).required('Bắt buộc nhập họ tên'),
            password: Yup.string().min(4, 'Tối thiểu 4 ký tự').required('Bắt buộc nhập mật khẩu'),
            subject_id: Yup.number().required('Bắt buộc chọn môn thi')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>Thêm tài khoản giám khảo</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Tài khoản"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.code && errors.code)}
                    helperText={touched.code && errors.code}
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
                    helperText={touched.password && errors.password}
                  />
                  <TextField
                    fullWidth
                    select
                    label="Môn thi"
                    name="subject_id"
                    value={values.subject_id}
                    onChange={handleChange}
                    error={Boolean(touched.subject_id && errors.subject_id)}
                    helperText={touched.subject_id && errors.subject_id}
                  >
                    {subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
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

export default ExaminersPage;
