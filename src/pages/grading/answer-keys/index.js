import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

const ANSWER_TYPES = ['INTEGER_NUMBER', 'DOUBLE_NUMBER', 'ORDER_LIST', 'UNORDER_LIST', 'COORDINATE', 'MIX'];
const QUESTION_TYPE_LABEL = { 1: 'TN 1 đáp án', 2: 'TN nhiều đáp án', 4: 'Trả lời ngắn' };

// ==============================|| B2 - TAB ĐÁP ÁN ||============================== //

const AnswerKeysTab = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [subjectId, setSubjectId] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [editing, setEditing] = useState(null);
  const [questionMarks, setQuestionMarks] = useState([]);

  useEffect(() => {
    councilMgmtService
      .getLookup('question_marks')
      .then((res) => setQuestionMarks(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradingService.getAnswerKeys({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        subject_id: subjectId || undefined,
        council_turn_code: councilTurnCode || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, subjectId, councilTurnCode]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await withLoading(
        () => gradingService.updateAnswerKey(editing.question_id, values),
        'Đang cập nhật đáp án... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setEditing(null);
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Cập nhật thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'question_id', headerName: 'ID câu hỏi', width: 100 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 140,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    {
      field: 'question_type_id',
      headerName: 'Loại câu hỏi',
      width: 150,
      valueGetter: (value) => QUESTION_TYPE_LABEL[value] || value
    },
    { field: 'answer_type', headerName: 'Kiểu đáp án', width: 150 },
    { field: 'answer_key', headerName: 'Đáp án', flex: 1, minWidth: 150 },
    {
      field: 'question_mark_id',
      headerName: 'Điểm',
      width: 100,
      valueGetter: (value) => questionMarks.find((m) => m.id === value)?.value ?? value
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Sửa đáp án">
          <IconButton size="small" onClick={() => setEditing(params.row)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
        <TextField
          select
          size="small"
          label="Môn thi"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          {subjects.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Mã ca thi"
          value={councilTurnCode}
          onChange={(e) => setCouncilTurnCode(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Stack>
      <DataGrid
        autoHeight
        rows={rows}
        getRowId={(row) => row.question_id}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
      />

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        {editing && (
          <Formik
            initialValues={{
              answer_key: editing.answer_key || '',
              answer_type: editing.answer_type || 'INTEGER_NUMBER',
              question_mark_id: editing.question_mark_id || ''
            }}
            validationSchema={Yup.object().shape({
              answer_key: Yup.string().max(255).required('Bắt buộc nhập đáp án'),
              answer_type: Yup.string().required(),
              question_mark_id: Yup.number().required('Bắt buộc chọn điểm')
            })}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting }) => (
              <form noValidate onSubmit={submitForm}>
                <DialogTitle>Sửa đáp án — câu #{editing.question_id}</DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      Sửa đáp án sẽ tự động chấm lại toàn bộ bài đã có điểm cho câu này.
                    </Typography>
                    <TextField
                      fullWidth
                      label="Đáp án"
                      name="answer_key"
                      value={values.answer_key}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.answer_key && errors.answer_key)}
                      helperText={touched.answer_key && errors.answer_key}
                    />
                    {editing.question_type_id === 4 && (
                      <TextField fullWidth select label="Kiểu đáp án" name="answer_type" value={values.answer_type} onChange={handleChange}>
                        {ANSWER_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                    <TextField
                      fullWidth
                      select
                      label="Điểm"
                      name="question_mark_id"
                      value={values.question_mark_id}
                      onChange={handleChange}
                      error={Boolean(touched.question_mark_id && errors.question_mark_id)}
                      helperText={touched.question_mark_id && errors.question_mark_id}
                    >
                      {questionMarks.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.value} ({m.name})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setEditing(null)}>Huỷ</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Lưu
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        )}
      </Dialog>
    </Stack>
  );
};

// ==============================|| B2 - TAB RUBRIC ||============================== //

const emptyRubric = { code: '', name: '', desc: '', subject_id: '', matrix_location: 0 };
const emptyCriteria = { code: '', name: '', desc: '', min_score: 0, max_score: 10, scores: '0,0.25,0.5,...,10' };

const RubricsTab = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState(null);
  const [criteriaRubric, setCriteriaRubric] = useState(null);
  const [criterias, setCriterias] = useState([]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gradingService.getRubrics({ page: paginationModel.page, pageSize: paginationModel.pageSize });
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

  const handleSubmitRubric = async (values, { setSubmitting, setErrors }) => {
    try {
      const res = await withLoading(
        () => (editingRubric ? gradingService.updateRubric(editingRubric.id, values) : gradingService.createRubric(values)),
        'Đang lưu rubric... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      setDialogOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const openCriterias = async (rubric) => {
    setCriteriaRubric(rubric);
    try {
      const res = await gradingService.getRubricCriterias(rubric.id);
      setCriterias(res.data.data.length ? res.data.data : [{ ...emptyCriteria }]);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được tiêu chí', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSaveCriterias = async () => {
    try {
      const res = await withLoading(
        () => gradingService.updateRubricCriterias(criteriaRubric.id, criterias),
        'Đang lưu tiêu chí... Vui lòng chờ'
      );
      setCriterias(res.data.data);
      openSnackbar({ open: true, message: 'Đã lưu tiêu chí rubric', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const updateCriteriaField = (index, field, value) => {
    setCriterias((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const columns = [
    { field: 'code', headerName: 'Mã rubric', width: 140 },
    { field: 'name', headerName: 'Tên', flex: 1, minWidth: 200 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 140,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    { field: 'matrix_location', headerName: 'Câu số', width: 90 },
    { field: 'criteria_count', headerName: 'Số tiêu chí', width: 110 },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Sửa rubric">
            <IconButton
              size="small"
              onClick={() => {
                setEditingRubric(params.row);
                setDialogOpen(true);
              }}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Button size="small" onClick={() => openCriterias(params.row)}>
            Tiêu chí
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={2}>
      <Box>
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => {
            setEditingRubric(null);
            setDialogOpen(true);
          }}
        >
          Thêm rubric
        </Button>
      </Box>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editingRubric || emptyRubric}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập mã'),
            name: Yup.string().max(255).required('Bắt buộc nhập tên'),
            subject_id: Yup.number().required('Bắt buộc chọn môn thi'),
            matrix_location: Yup.number().min(0).required('Bắt buộc nhập số thứ tự câu')
          })}
          onSubmit={handleSubmitRubric}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editingRubric ? 'Sửa rubric' : 'Thêm rubric'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Mã rubric"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
                    select
                    label="Môn thi"
                    name="subject_id"
                    value={values.subject_id}
                    onChange={handleChange}
                    disabled={!!editingRubric}
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
                    type="number"
                    label="Câu số (matrix_location)"
                    name="matrix_location"
                    value={values.matrix_location}
                    onChange={handleChange}
                    error={Boolean(touched.matrix_location && errors.matrix_location)}
                    helperText={touched.matrix_location && errors.matrix_location}
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

      <Dialog open={!!criteriaRubric} onClose={() => setCriteriaRubric(null)} fullWidth maxWidth="md">
        <DialogTitle>Tiêu chí rubric — {criteriaRubric?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {criterias.map((c, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  size="small"
                  label="Mã"
                  value={c.code}
                  onChange={(e) => updateCriteriaField(index, 'code', e.target.value)}
                  sx={{ width: 100 }}
                />
                <TextField
                  size="small"
                  label="Tên tiêu chí"
                  value={c.name}
                  onChange={(e) => updateCriteriaField(index, 'name', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Điểm tối thiểu"
                  value={c.min_score}
                  onChange={(e) => updateCriteriaField(index, 'min_score', e.target.value)}
                  sx={{ width: 130 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Điểm tối đa"
                  value={c.max_score}
                  onChange={(e) => updateCriteriaField(index, 'max_score', e.target.value)}
                  sx={{ width: 130 }}
                />
                <TextField
                  size="small"
                  label="Các mức điểm (phẩy)"
                  value={c.scores}
                  onChange={(e) => updateCriteriaField(index, 'scores', e.target.value)}
                  sx={{ width: 220 }}
                />
                <Button color="error" onClick={() => setCriterias((prev) => prev.filter((_, i) => i !== index))}>
                  Xoá
                </Button>
              </Stack>
            ))}
            <Button startIcon={<PlusOutlined />} onClick={() => setCriterias((prev) => [...prev, { ...emptyCriteria }])}>
              Thêm tiêu chí
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriteriaRubric(null)}>Đóng</Button>
          <Button variant="contained" onClick={handleSaveCriterias}>
            Lưu tiêu chí
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ==============================|| B2 - ĐÁP ÁN & RUBRIC ||============================== //

const AnswerKeysPage = () => {
  const [tab, setTab] = useState(0);

  return (
    <MainCard title="Đáp án & Rubric" content={false}>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 2, pt: 1 }}>
        <Tab label="Đáp án trắc nghiệm / trả lời ngắn" />
        <Tab label="Rubric tự luận" />
      </Tabs>
      <Box sx={{ p: 2 }}>{tab === 0 ? <AnswerKeysTab /> : <RubricsTab />}</Box>
    </MainCard>
  );
};

export default AnswerKeysPage;
