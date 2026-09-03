import { useCallback, useEffect, useState } from 'react';

// material-ui
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { PlusOutlined, ThunderboltOutlined, SwapOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

// ==============================|| B5 - CẶP GIÁM KHẢO ||============================== //

const scopeSchema = Yup.object().shape({
  council_code: Yup.string().max(50).required('Bắt buộc nhập mã hội đồng'),
  council_turn_code: Yup.string().max(50).required('Bắt buộc nhập mã ca thi'),
  subject_id: Yup.number().required('Bắt buộc chọn môn thi'),
  start_at: Yup.date().required('Bắt buộc chọn ngày bắt đầu'),
  finish_at: Yup.date().required('Bắt buộc chọn ngày kết thúc')
});

const ExaminerPairsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [manualOpen, setManualOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [replacing, setReplacing] = useState(null); // { pair, role }
  const [examinerOptions, setExaminerOptions] = useState([]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradingService.getExaminerPairs({ page: paginationModel.page, pageSize: paginationModel.pageSize });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const fetchExaminerOptions = async (subjectId) => {
    try {
      const res = await gradingService.getExaminers({ page: 0, pageSize: 200, subject_id: subjectId });
      setExaminerOptions(res.data.data.items);
    } catch (e) {
      setExaminerOptions([]);
    }
  };

  const handleCreateManual = async (values, { setSubmitting, setErrors }) => {
    try {
      const res = await withLoading(() => gradingService.createExaminerPair(values), 'Đang tạo cặp... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setManualOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Tạo cặp thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoPair = async (values, { setSubmitting }) => {
    try {
      const res = await withLoading(() => gradingService.autoPairExaminers(values), 'Đang ghép cặp... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setAutoOpen(false);
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Ghép cặp thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplace = async (values, { setSubmitting }) => {
    try {
      const res = await withLoading(
        () =>
          gradingService.replaceExaminerInPair(replacing.pair.id, {
            old_examiner_id: replacing.role.id,
            new_examiner_id: values.new_examiner_id,
            start_at: values.start_at,
            finish_at: values.finish_at
          }),
        'Đang thay giám khảo... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setReplacing(null);
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thay giám khảo thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const renderExaminer = (params, role) => {
    const examiner = params.row[role];
    if (!examiner) return '-';
    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <span>
          {examiner.name} ({examiner.no_done_test}/{examiner.no_assigned_test})
        </span>
        <Tooltip title="Thay giám khảo này">
          <IconButton
            size="small"
            onClick={async () => {
              await fetchExaminerOptions(params.row.subject_id);
              setReplacing({ pair: params.row, role: examiner });
            }}
          >
            <SwapOutlined style={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const columns = [
    { field: 'code', headerName: 'Mã cặp', width: 180 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 140,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 120 },
    { field: 'no_tests', headerName: 'Số bài', width: 90 },
    { field: 'examiner1', headerName: 'Giám khảo 1', flex: 1, minWidth: 220, renderCell: (p) => renderExaminer(p, 'examiner1') },
    { field: 'examiner2', headerName: 'Giám khảo 2', flex: 1, minWidth: 220, renderCell: (p) => renderExaminer(p, 'examiner2') }
  ];

  return (
    <MainCard
      title="Cặp giám khảo chấm tự luận"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ThunderboltOutlined />} onClick={() => setAutoOpen(true)}>
            Ghép tự động
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setManualOpen(true)}>
            Tạo cặp thủ công
          </Button>
        </Stack>
      }
    >
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
        getRowHeight={() => 'auto'}
      />

      {/* Tạo cặp thủ công */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} fullWidth maxWidth="sm">
        <Formik
          initialValues={{
            council_code: '',
            council_turn_code: '',
            subject_id: '',
            examiner1_id: '',
            examiner2_id: '',
            start_at: '',
            finish_at: ''
          }}
          validationSchema={scopeSchema.shape({
            examiner1_id: Yup.number().required('Bắt buộc chọn giám khảo 1'),
            examiner2_id: Yup.number().required('Bắt buộc chọn giám khảo 2')
          })}
          onSubmit={handleCreateManual}
        >
          {({ values, errors, touched, handleChange, handleSubmit: submitForm, isSubmitting }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>Tạo cặp giám khảo thủ công</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã hội đồng thi"
                    name="council_code"
                    value={values.council_code}
                    onChange={handleChange}
                    error={Boolean(touched.council_code && errors.council_code)}
                    helperText={touched.council_code && errors.council_code}
                  />
                  <TextField
                    fullWidth
                    label="Mã ca thi"
                    name="council_turn_code"
                    value={values.council_turn_code}
                    onChange={handleChange}
                    error={Boolean(touched.council_turn_code && errors.council_turn_code)}
                    helperText={touched.council_turn_code && errors.council_turn_code}
                  />
                  <TextField
                    fullWidth
                    select
                    label="Môn thi"
                    name="subject_id"
                    value={values.subject_id}
                    onChange={(e) => {
                      handleChange(e);
                      fetchExaminerOptions(e.target.value);
                    }}
                    error={Boolean(touched.subject_id && errors.subject_id)}
                    helperText={touched.subject_id && errors.subject_id}
                  >
                    {subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    select
                    label="Giám khảo 1"
                    name="examiner1_id"
                    value={values.examiner1_id}
                    onChange={handleChange}
                    disabled={!values.subject_id}
                    error={Boolean(touched.examiner1_id && errors.examiner1_id)}
                    helperText={touched.examiner1_id && errors.examiner1_id}
                  >
                    {examinerOptions.map((ex) => (
                      <MenuItem key={ex.id} value={ex.id}>
                        {ex.name} ({ex.code})
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    select
                    label="Giám khảo 2"
                    name="examiner2_id"
                    value={values.examiner2_id}
                    onChange={handleChange}
                    disabled={!values.subject_id}
                    error={Boolean(touched.examiner2_id && errors.examiner2_id)}
                    helperText={touched.examiner2_id && errors.examiner2_id}
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
                      label="Ngày bắt đầu"
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
                      label="Ngày kết thúc"
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
                <Button onClick={() => setManualOpen(false)}>Huỷ</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Tạo cặp
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      {/* Ghép tự động */}
      <Dialog open={autoOpen} onClose={() => setAutoOpen(false)} fullWidth maxWidth="sm">
        <Formik
          initialValues={{ council_code: '', council_turn_code: '', subject_id: '', start_at: '', finish_at: '' }}
          validationSchema={scopeSchema}
          onSubmit={handleAutoPair}
        >
          {({ values, errors, touched, handleChange, handleSubmit: submitForm, isSubmitting }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>Ghép cặp giám khảo tự động</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã hội đồng thi"
                    name="council_code"
                    value={values.council_code}
                    onChange={handleChange}
                    error={Boolean(touched.council_code && errors.council_code)}
                    helperText={touched.council_code && errors.council_code}
                  />
                  <TextField
                    fullWidth
                    label="Mã ca thi"
                    name="council_turn_code"
                    value={values.council_turn_code}
                    onChange={handleChange}
                    error={Boolean(touched.council_turn_code && errors.council_turn_code)}
                    helperText={touched.council_turn_code && errors.council_turn_code}
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
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày bắt đầu"
                      name="start_at"
                      InputLabelProps={{ shrink: true }}
                      value={values.start_at}
                      onChange={handleChange}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày kết thúc"
                      name="finish_at"
                      InputLabelProps={{ shrink: true }}
                      value={values.finish_at}
                      onChange={handleChange}
                    />
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setAutoOpen(false)}>Huỷ</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Ghép tự động
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      {/* Thay giám khảo */}
      <Dialog open={!!replacing} onClose={() => setReplacing(null)} fullWidth maxWidth="sm">
        {replacing && (
          <Formik initialValues={{ new_examiner_id: '', start_at: '', finish_at: '' }} onSubmit={handleReplace}>
            {({ values, handleChange, handleSubmit: submitForm, isSubmitting }) => (
              <form noValidate onSubmit={submitForm}>
                <DialogTitle>
                  Thay giám khảo {replacing.role.name} ({replacing.role.code})
                </DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      select
                      label="Giám khảo thay thế"
                      name="new_examiner_id"
                      value={values.new_examiner_id}
                      onChange={handleChange}
                    >
                      {examinerOptions
                        .filter((ex) => ex.id !== replacing.role.id)
                        .map((ex) => (
                          <MenuItem key={ex.id} value={ex.id}>
                            {ex.name} ({ex.code})
                          </MenuItem>
                        ))}
                    </TextField>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Ngày bắt đầu (bài chưa chốt)"
                        name="start_at"
                        InputLabelProps={{ shrink: true }}
                        value={values.start_at}
                        onChange={handleChange}
                      />
                      <TextField
                        fullWidth
                        type="date"
                        label="Ngày kết thúc"
                        name="finish_at"
                        InputLabelProps={{ shrink: true }}
                        value={values.finish_at}
                        onChange={handleChange}
                      />
                    </Stack>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setReplacing(null)}>Huỷ</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Thay giám khảo
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

export default ExaminerPairsPage;
