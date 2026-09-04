import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';

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
import useQuestionTypes from 'hooks/useQuestionTypes';
import sanitizeHtml from 'utils/sanitizeHtml';

const ANSWER_TYPE_OPTIONS = [
  { value: 'INTEGER_NUMBER', label: 'Dạng số NGUYÊN' },
  { value: 'DOUBLE_NUMBER', label: 'Dạng số THỰC' },
  { value: 'UNORDER_LIST', label: 'Dạng liệt kê KHÔNG thứ tự' },
  { value: 'ORDER_LIST', label: 'Dạng liệt kê CÓ thứ tự' },
  { value: 'COORDINATE', label: 'Dạng TỌA ĐỘ' },
  { value: 'MIX', label: 'Dạng hỗn hợp chữ số' }
];

const QUESTION_TYPE_TN1 = 1;
const QUESTION_TYPE_TNN = 2;
const QUESTION_TYPE_TLN = 4;
const QUESTION_TYPE_ESSAY = 5;

// ==============================|| B2 - TAB ĐÁP ÁN ||============================== //

const AnswerKeysTab = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const questionTypes = useQuestionTypes();

  const [councils, setCouncils] = useState([]);
  const [councilTurns, setCouncilTurns] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [questionTypeId, setQuestionTypeId] = useState('');

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [hasSearched, setHasSearched] = useState(false);

  const [questionMarks, setQuestionMarks] = useState([]);
  const [rubricOptions, setRubricOptions] = useState([]);

  // Sửa đáp án
  const [editing, setEditing] = useState(null); // row đang sửa
  const [editDetail, setEditDetail] = useState(null); // nội dung câu hỏi + phương án (từ API show)
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [requiresResetOpen, setRequiresResetOpen] = useState(false);

  // Popup xem nội dung câu hỏi (icon mắt)
  const [viewDetail, setViewDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Popup xem tiêu chí rubric (chỉ xem, không sửa — sửa thật sự ở tab Rubric)
  const [viewRubric, setViewRubric] = useState(null);
  const [viewRubricCriterias, setViewRubricCriterias] = useState([]);

  useEffect(() => {
    councilMgmtService
      .getLookup('question_marks')
      .then((res) => setQuestionMarks(res.data.data))
      .catch(() => {});
    councilMgmtService
      .getLookup('councils')
      .then((res) => setCouncils(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCouncilTurnCode('');
    if (!councilCode) {
      setCouncilTurns([]);
      return;
    }
    councilMgmtService
      .getLookup('council_turns', { council_code: councilCode })
      .then((res) => setCouncilTurns(res.data.data))
      .catch(() => {});
  }, [councilCode]);

  const fetchRows = useCallback(
    async (model) => {
      if (!councilCode) {
        openSnackbar({ open: true, message: 'Chọn Hội đồng thi', variant: 'alert', alert: { color: 'warning' } });
        return;
      }
      setLoading(true);
      try {
        const res = await gradingService.getAnswerKeys({
          council_code: councilCode,
          council_turn_code: councilTurnCode || undefined,
          subject_id: subjectId || undefined,
          question_type_id: questionTypeId || undefined,
          page: model.page,
          pageSize: model.pageSize
        });
        setRows(res.data.data.items);
        setRowCount(res.data.data.total);
        setHasSearched(true);
      } catch (e) {
        openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
      } finally {
        setLoading(false);
      }
    },
    [councilCode, councilTurnCode, subjectId, questionTypeId]
  );

  const handleViewData = () => {
    const initial = { page: 0, pageSize: 20 };
    setPaginationModel(initial);
    fetchRows(initial);
  };

  const handlePaginationChange = (model) => {
    setPaginationModel(model);
    if (hasSearched) fetchRows(model);
  };

  // ---- Xem nội dung câu hỏi (icon mắt) ----
  const handleView = async (row) => {
    setViewLoading(true);
    setViewDetail({ loading: true });
    try {
      const res = await gradingService.getAnswerKeyDetail(row.question_id);
      setViewDetail(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được nội dung câu hỏi', variant: 'alert', alert: { color: 'error' } });
      setViewDetail(null);
    } finally {
      setViewLoading(false);
    }
  };

  // ---- Xem tiêu chí rubric (click vào Mã rubric ở cột Đáp án) ----
  const handleViewRubric = async (row) => {
    setViewRubric({ code: row.rubric_code, name: row.rubric_name });
    try {
      const res = await gradingService.getRubricCriterias(row.rubric_id);
      setViewRubricCriterias(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được tiêu chí rubric', variant: 'alert', alert: { color: 'error' } });
    }
  };

  // ---- Sửa đáp án ----
  const openEdit = async (row) => {
    setEditing(row);
    setEditDetail(null);
    if (row.question_type_id === QUESTION_TYPE_ESSAY) {
      setEditValues({ rubric_id: row.rubric_id || '' });
      gradingService
        .getRubrics({ subject_id: row.subject_id, pageSize: 200 })
        .then((res) => setRubricOptions(res.data.data.items))
        .catch(() => setRubricOptions([]));
    } else if (row.question_type_id === QUESTION_TYPE_TNN) {
      setEditValues({
        tn_choices: row.answer_key ? row.answer_key.split(',').map((s) => s.trim()) : [],
        question_mark_id: row.question_mark_id || ''
      });
    } else if (row.question_type_id === QUESTION_TYPE_TN1) {
      setEditValues({ tn_choice: row.answer_key || '', question_mark_id: row.question_mark_id || '' });
    } else {
      setEditValues({
        answer_key: row.answer_key || '',
        answer_type: row.answer_type || 'INTEGER_NUMBER',
        question_mark_id: row.question_mark_id || ''
      });
    }
    if (row.question_type_id === QUESTION_TYPE_TN1 || row.question_type_id === QUESTION_TYPE_TNN) {
      try {
        const res = await gradingService.getAnswerKeyDetail(row.question_id);
        setEditDetail(res.data.data);
      } catch (e) {
        openSnackbar({ open: true, message: 'Không tải được danh sách phương án', variant: 'alert', alert: { color: 'error' } });
      }
    }
  };

  const closeEdit = () => {
    setEditing(null);
    setEditDetail(null);
    setConfirmSaveOpen(false);
    setRequiresResetOpen(false);
  };

  const buildObjectivePayload = () => {
    if (editing.question_type_id === QUESTION_TYPE_TNN) {
      return { answer_key: (editValues.tn_choices || []).join(','), question_mark_id: editValues.question_mark_id };
    }
    if (editing.question_type_id === QUESTION_TYPE_TN1) {
      return { answer_key: editValues.tn_choice, question_mark_id: editValues.question_mark_id };
    }
    return { answer_key: editValues.answer_key, answer_type: editValues.answer_type, question_mark_id: editValues.question_mark_id };
  };

  const doSaveObjective = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      const res = await withLoading(
        () => gradingService.updateAnswerKey(editing.question_id, buildObjectivePayload()),
        'Đang lưu đáp án... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      closeEdit();
      fetchRows(paginationModel);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSaving(false);
    }
  };

  const doSaveEssay = async (forceReset) => {
    setSaving(true);
    try {
      const res = await withLoading(
        () =>
          gradingService.updateAnswerKey(editing.question_id, {
            rubric_id: editValues.rubric_id,
            force_reset: forceReset || undefined
          }),
        'Đang lưu... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      closeEdit();
      fetchRows(paginationModel);
    } catch (e) {
      if (e?.data?.requires_reset) {
        setRequiresResetOpen(true);
      } else {
        openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (editing.question_type_id === QUESTION_TYPE_ESSAY) {
      doSaveEssay(false);
    } else {
      setConfirmSaveOpen(true);
    }
  };

  const columns = [
    { field: 'question_code', headerName: 'Mã câu hỏi', width: 160 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 160,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    {
      field: 'question_type_id',
      headerName: 'Loại câu hỏi',
      width: 190,
      valueGetter: (value) => questionTypes.find((t) => t.id === value)?.name || value
    },
    {
      field: 'answer_type',
      headerName: 'Kiểu đáp án',
      width: 170,
      valueGetter: (value, row) =>
        row.question_type_id === QUESTION_TYPE_TLN ? ANSWER_TYPE_OPTIONS.find((o) => o.value === value)?.label || value : '-'
    },
    {
      field: 'answer_key',
      headerName: 'Đáp án',
      flex: 1,
      minWidth: 180,
      renderCell: (params) =>
        params.row.question_type_id === QUESTION_TYPE_ESSAY ? (
          <Link component="button" underline="hover" onClick={() => handleViewRubric(params.row)}>
            {params.row.rubric_code || '(chưa gán rubric)'}
          </Link>
        ) : (
          params.value
        )
    },
    {
      field: 'question_mark_id',
      headerName: 'Điểm',
      width: 100,
      valueGetter: (value, row) =>
        row.question_type_id === QUESTION_TYPE_ESSAY ? '-' : questionMarks.find((m) => m.id === value)?.value ?? value
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Xem câu hỏi">
            <IconButton size="small" onClick={() => handleView(params.row)}>
              <EyeOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sửa đáp án">
            <IconButton size="small" onClick={() => openEdit(params.row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="center">
        <TextField
          select
          size="small"
          label="Hội đồng thi"
          value={councilCode}
          onChange={(e) => setCouncilCode(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">-- Chọn hội đồng --</MenuItem>
          {councils.map((c) => (
            <MenuItem key={c.code} value={c.code}>
              {c.desc || c.code}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Ca thi"
          value={councilTurnCode}
          onChange={(e) => setCouncilTurnCode(e.target.value)}
          disabled={!councilCode}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">-- Tất cả ca thi --</MenuItem>
          {councilTurns.map((t) => (
            <MenuItem key={t.code} value={t.code}>
              {t.name || t.code}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Môn thi"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">-- Tất cả môn thi --</MenuItem>
          {subjects.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Loại câu hỏi"
          value={questionTypeId}
          onChange={(e) => setQuestionTypeId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">-- Tất cả loại --</MenuItem>
          {questionTypes.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleViewData}>
          Xem dữ liệu
        </Button>
      </Stack>

      {!hasSearched ? (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          Chọn Hội đồng thi (bắt buộc), thu hẹp thêm nếu cần, rồi bấm &quot;Xem dữ liệu&quot;
        </Typography>
      ) : (
        <DataGrid
          autoHeight
          rows={rows}
          getRowId={(row) => row.question_id}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      )}

      {/* Popup xem nội dung câu hỏi */}
      <Dialog open={!!viewDetail} onClose={() => setViewDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>Xem câu hỏi{viewDetail?.code ? ` — ${viewDetail.code}` : ''}</DialogTitle>
        <DialogContent>
          {viewLoading || !viewDetail || viewDetail.loading ? (
            <Typography color="text.secondary">Đang tải...</Typography>
          ) : (
            <Stack spacing={1.5}>
              {viewDetail.pre_content && <Box dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewDetail.pre_content) }} />}
              <Box dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewDetail.content) }} />
              {viewDetail.post_content && <Box dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewDetail.post_content) }} />}
              {viewDetail.options?.length > 0 && (
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {viewDetail.options.map((o) => (
                    <Typography key={o.index} variant="body2">
                      <b>{o.index}.</b> {o.text}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetail(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Popup xem tiêu chí rubric (chỉ xem) */}
      <Dialog open={!!viewRubric} onClose={() => setViewRubric(null)} fullWidth maxWidth="sm">
        <DialogTitle>Tiêu chí rubric — {viewRubric?.code} ({viewRubric?.name})</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {viewRubricCriterias.map((c) => (
              <Box key={c.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  {c.code} — {c.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Điểm: {c.min_score} - {c.max_score} | Các mức: {c.scores}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRubric(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Sửa đáp án */}
      <Dialog open={!!editing} onClose={closeEdit} fullWidth maxWidth="sm">
        {editing && (
          <>
            <DialogTitle>Sửa đáp án — {editing.question_code}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {editing.question_type_id === QUESTION_TYPE_TN1 && (
                  <TextField
                    fullWidth
                    select
                    label="Phương án đúng"
                    value={editValues.tn_choice || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, tn_choice: e.target.value }))}
                  >
                    {(editDetail?.options || []).map((o) => (
                      <MenuItem key={o.index} value={String(o.index)}>
                        {o.index}. {o.text}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {editing.question_type_id === QUESTION_TYPE_TNN && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phương án đúng (chọn nhiều)
                    </Typography>
                    <Select
                      fullWidth
                      multiple
                      value={editValues.tn_choices || []}
                      onChange={(e) => setEditValues((v) => ({ ...v, tn_choices: e.target.value }))}
                      input={<OutlinedInput />}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {(editDetail?.options || []).map((o) => (
                        <MenuItem key={o.index} value={String(o.index)}>
                          <Checkbox checked={(editValues.tn_choices || []).includes(String(o.index))} />
                          <ListItemText primary={`${o.index}. ${o.text}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}

                {editing.question_type_id === QUESTION_TYPE_TLN && (
                  <>
                    <TextField
                      fullWidth
                      label="Đáp án"
                      value={editValues.answer_key || ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, answer_key: e.target.value }))}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Kiểu đáp án"
                      value={editValues.answer_type || ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, answer_type: e.target.value }))}
                    >
                      {ANSWER_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}

                {editing.question_type_id === QUESTION_TYPE_ESSAY && (
                  <>
                    <Typography variant="body2" color="warning.main">
                      Câu tự luận không nhập đáp án — chọn rubric dùng để giám khảo chấm tay.
                    </Typography>
                    <TextField
                      fullWidth
                      select
                      label="Rubric"
                      value={editValues.rubric_id || ''}
                      onChange={(e) => setEditValues((v) => ({ ...v, rubric_id: e.target.value }))}
                    >
                      {rubricOptions.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.code} — {r.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}

                {editing.question_type_id !== QUESTION_TYPE_ESSAY && (
                  <TextField
                    fullWidth
                    select
                    label="Điểm"
                    value={editValues.question_mark_id || ''}
                    onChange={(e) => setEditValues((v) => ({ ...v, question_mark_id: e.target.value }))}
                  >
                    {questionMarks.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.value} ({m.name})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEdit}>Huỷ</Button>
              <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
                Lưu đáp án
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Xác nhận lưu (TN/TLN) — cảnh báo chấm lại */}
      <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)}>
        <DialogTitle>Xác nhận lưu đáp án</DialogTitle>
        <DialogContent>
          <Typography>Các bài đã có điểm cho câu này sẽ được tự động chấm lại theo đáp án mới. Bạn có chắc chắn muốn lưu?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveOpen(false)}>Huỷ</Button>
          <Button variant="contained" color="warning" onClick={doSaveObjective} disabled={saving}>
            Xác nhận lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận reset điểm (đổi rubric của câu đã có người chấm) */}
      <Dialog open={requiresResetOpen} onClose={() => setRequiresResetOpen(false)}>
        <DialogTitle>Câu này đã có giám khảo chấm điểm</DialogTitle>
        <DialogContent>
          <Typography>
            Đổi rubric sẽ <b>xoá toàn bộ điểm đã chấm</b> của câu này (mọi bài làm) vì tiêu chí rubric mới không còn khớp nghĩa với điểm cũ
            — các bài này sẽ trở về trạng thái chờ chấm lại từ đầu. Bạn có chắc chắn muốn tiếp tục?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequiresResetOpen(false)}>Huỷ</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setRequiresResetOpen(false);
              doSaveEssay(true);
            }}
            disabled={saving}
          >
            Xác nhận reset &amp; đổi rubric
          </Button>
        </DialogActions>
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
  const [savingCriterias, setSavingCriterias] = useState(false);
  const [criteriaRequiresResetOpen, setCriteriaRequiresResetOpen] = useState(false);

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

  const doSaveCriterias = async (forceReset) => {
    setSavingCriterias(true);
    try {
      const res = await gradingService.updateRubricCriterias(criteriaRubric.id, criterias, forceReset);
      setCriterias(res.data.data);
      openSnackbar({ open: true, message: 'Đã lưu tiêu chí rubric', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      if (e?.data?.requires_reset) {
        setCriteriaRequiresResetOpen(true);
      } else {
        openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
      }
    } finally {
      setSavingCriterias(false);
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
          <Button variant="contained" onClick={() => doSaveCriterias(false)} disabled={savingCriterias}>
            Lưu tiêu chí
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xác nhận reset điểm (sửa tiêu chí của rubric đã có người chấm) */}
      <Dialog open={criteriaRequiresResetOpen} onClose={() => setCriteriaRequiresResetOpen(false)}>
        <DialogTitle>Rubric này đã có giám khảo chấm điểm</DialogTitle>
        <DialogContent>
          <Typography>
            Sửa tiêu chí sẽ <b>xoá toàn bộ điểm đã chấm</b> theo bộ tiêu chí cũ ở mọi câu đang dùng rubric này — các bài liên quan sẽ trở
            về trạng thái chờ chấm lại từ đầu. Bạn có chắc chắn muốn tiếp tục?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriteriaRequiresResetOpen(false)}>Huỷ</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setCriteriaRequiresResetOpen(false);
              doSaveCriterias(true);
            }}
            disabled={savingCriterias}
          >
            Xác nhận reset &amp; lưu tiêu chí
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
        <Tab label="Đáp án / Rubric" />
        <Tab label="Quản lý Rubric" />
      </Tabs>
      <Box sx={{ p: 2 }}>{tab === 0 ? <AnswerKeysTab /> : <RubricsTab />}</Box>
    </MainCard>
  );
};

export default AnswerKeysPage;
