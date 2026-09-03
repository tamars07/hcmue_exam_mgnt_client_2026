import { useCallback, useEffect, useState } from 'react';

// material-ui
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

const STATUS_LABEL = {
  NEED_REGRADE: { label: 'Cần chấm lại (round 2)', color: 'warning' },
  NEED_THIRD: { label: 'Cần giám khảo thứ 3', color: 'error' }
};

// ==============================|| B7 - XỬ LÝ LỆCH ĐIỂM ||============================== //

const DeviationsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [examinerOptions, setExaminerOptions] = useState([]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradingService.getDeviations({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        status: statusFilter || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, statusFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openAssignThird = async (row) => {
    setAssigning(row);
    try {
      const res = await gradingService.getExaminers({ page: 0, pageSize: 200, subject_id: row.subject_id });
      setExaminerOptions(res.data.data.items);
    } catch (e) {
      setExaminerOptions([]);
    }
  };

  const handleAssignThird = async (values, { setSubmitting }) => {
    try {
      const res = await withLoading(
        () => gradingService.assignThirdExaminer(assigning.id, values),
        'Đang gán giám khảo thứ 3... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setAssigning(null);
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Gán thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'examinee_test_code', headerName: 'Mã phách', width: 160 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 140,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    { field: 'matrix_location', headerName: 'Câu số', width: 90 },
    { field: 'current_round', headerName: 'Vòng chấm', width: 100 },
    {
      field: 'diff_percent',
      headerName: '% Lệch',
      width: 100,
      valueGetter: (value) => (value !== null && value !== undefined ? `${Number(value).toFixed(1)}%` : '-')
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 190,
      renderCell: (params) => {
        const s = STATUS_LABEL[params.value] || { label: params.value, color: 'default' };
        return <Chip label={s.label} color={s.color} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params.row.status === 'NEED_THIRD' && !params.row.third_examiner_id ? (
          <Button size="small" variant="outlined" onClick={() => openAssignThird(params.row)}>
            Gán giám khảo thứ 3
          </Button>
        ) : params.row.status === 'NEED_THIRD' ? (
          <Chip label="Đã gán GK3" size="small" />
        ) : null
    }
  ];

  return (
    <MainCard title="Xử lý lệch điểm / Giám khảo thứ 3">
      <Stack spacing={2}>
        <TextField
          select
          size="small"
          label="Trạng thái"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ maxWidth: 260 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="NEED_REGRADE">Cần chấm lại (round 2)</MenuItem>
          <MenuItem value="NEED_THIRD">Cần giám khảo thứ 3</MenuItem>
        </TextField>

        <DataGrid
          autoHeight
          rows={rows}
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

      <Dialog open={!!assigning} onClose={() => setAssigning(null)} fullWidth maxWidth="sm">
        {assigning && (
          <Formik
            initialValues={{ third_examiner_id: '', start_at: '', finish_at: '' }}
            validationSchema={Yup.object().shape({
              third_examiner_id: Yup.number().required('Bắt buộc chọn giám khảo'),
              start_at: Yup.date().required('Bắt buộc chọn ngày bắt đầu'),
              finish_at: Yup.date().required('Bắt buộc chọn ngày kết thúc')
            })}
            onSubmit={handleAssignThird}
          >
            {({ values, errors, touched, handleChange, handleSubmit: submitForm, isSubmitting }) => (
              <form noValidate onSubmit={submitForm}>
                <DialogTitle>
                  Gán giám khảo thứ 3 — mã phách {assigning.examinee_test_code}, câu {assigning.matrix_location}
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      select
                      label="Giám khảo thứ 3"
                      name="third_examiner_id"
                      value={values.third_examiner_id}
                      onChange={handleChange}
                      error={Boolean(touched.third_examiner_id && errors.third_examiner_id)}
                      helperText={touched.third_examiner_id && errors.third_examiner_id}
                    >
                      {examinerOptions.map((ex) => (
                        <MenuItem key={ex.id} value={ex.id}>
                          {ex.name} ({ex.code})
                        </MenuItem>
                      ))}
                    </TextField>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Hạn bắt đầu"
                        name="start_at"
                        InputLabelProps={{ shrink: true }}
                        value={values.start_at}
                        onChange={handleChange}
                        error={Boolean(touched.start_at && errors.start_at)}
                        helperText={touched.start_at && errors.start_at}
                      />
                      <TextField
                        fullWidth
                        type="date"
                        label="Hạn kết thúc"
                        name="finish_at"
                        InputLabelProps={{ shrink: true }}
                        value={values.finish_at}
                        onChange={handleChange}
                        error={Boolean(touched.finish_at && errors.finish_at)}
                        helperText={touched.finish_at && errors.finish_at}
                      />
                    </Stack>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setAssigning(null)}>Huỷ</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Gán
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        )}
      </Dialog>
    </MainCard>
  );
};

export default DeviationsPage;
