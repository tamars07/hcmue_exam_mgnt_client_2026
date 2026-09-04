import { useCallback, useEffect, useState } from 'react';

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
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleFilled,
  CloseCircleFilled,
  EyeOutlined,
  MinusCircleFilled,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import sanitizeHtml from 'utils/sanitizeHtml';

const QUESTION_TYPE_LABELS = { 1: 'Trắc nghiệm 1 đáp án', 2: 'Trắc nghiệm nhiều đáp án', 4: 'Trả lời ngắn', 5: 'Tự luận' };
const ANSWER_TYPE_LABELS = {
  INTEGER_NUMBER: 'Dạng số NGUYÊN',
  DOUBLE_NUMBER: 'Dạng số THỰC',
  UNORDER_LIST: 'Dạng liệt kê KHÔNG thứ tự',
  ORDER_LIST: 'Dạng liệt kê CÓ thứ tự',
  COORDINATE: 'Dạng TỌA ĐỘ',
  MIX: 'Dạng hỗn hợp chữ số'
};

const GRADING_STATUS_LABELS = { CHUA_CHAM: 'Chưa chấm', DANG_CHAM: 'Đang chấm', DA_CHAM: 'Đã chấm' };

// ==============================|| B3 - CHẤM TỰ ĐỘNG ||============================== //

const AutoMarkingPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilTurns, setCouncilTurns] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [searchCode, setSearchCode] = useState('');

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [hasSearched, setHasSearched] = useState(false);

  // Popup "Chi tiết bài thi"
  const [detailCode, setDetailCode] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);

  // Popup xem nội dung câu hỏi (bấm vào mã câu hỏi trong popup chi tiết)
  const [viewDetail, setViewDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Xác nhận "Chấm lại" 1 bài thi
  const [confirmRegradeCode, setConfirmRegradeCode] = useState(null);
  const [regrading, setRegrading] = useState(false);

  useEffect(() => {
    councilMgmtService
      .getLookup('councils')
      .then((res) => setCouncils(res.data.data))
      .catch(() => {});
  }, []);

  const handleCouncilChange = (value) => {
    setCouncilCode(value);
    setCouncilTurnCode('');
    setCouncilTurns([]);
    setSubjectId('');
    setSubjects([]);
    if (!value) return;
    councilMgmtService
      .getLookup('council_turns', { council_code: value })
      .then((res) => setCouncilTurns(res.data.data))
      .catch(() => {});
    councilMgmtService
      .getLookup('subjects', { council_code: value })
      .then((res) => setSubjects(res.data.data))
      .catch(() => {});
  };

  const scopeParams = useCallback(
    () => ({
      council_code: councilCode,
      council_turn_code: councilTurnCode || undefined,
      subject_id: subjectId || undefined,
      examinee_test_code: searchCode.trim() || undefined
    }),
    [councilCode, councilTurnCode, subjectId, searchCode]
  );

  const applyListResult = (data) => {
    setRows(data.items);
    setRowCount(data.total);
    setStats(data.stats);
    setHasSearched(true);
  };

  const fetchResults = useCallback(
    async (model) => {
      if (!councilCode) {
        openSnackbar({ open: true, message: 'Chọn Hội đồng thi', variant: 'alert', alert: { color: 'warning' } });
        return;
      }
      setLoading(true);
      try {
        const res = await gradingService.getAutoMarkingResults({ ...scopeParams(), page: model.page, pageSize: model.pageSize });
        applyListResult(res.data.data);
      } catch (e) {
        openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
      } finally {
        setLoading(false);
      }
    },
    [councilCode, scopeParams]
  );

  const handleViewResults = () => {
    const initial = { page: 0, pageSize: 20 };
    setPaginationModel(initial);
    fetchResults(initial);
  };

  const handleRunAutoMarking = async () => {
    if (!councilCode) {
      openSnackbar({ open: true, message: 'Chọn Hội đồng thi', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    setLoading(true);
    try {
      const initial = { page: 0, pageSize: 20 };
      const res = await withLoading(
        () => gradingService.runAutoMarking({ ...scopeParams(), page: initial.page, pageSize: initial.pageSize }),
        'Đang chấm tự động... Vui lòng chờ'
      );
      setPaginationModel(initial);
      applyListResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Chấm thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  };

  const handlePaginationChange = (model) => {
    setPaginationModel(model);
    if (hasSearched) fetchResults(model);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleViewResults();
  };

  const handleClearSearch = () => {
    setSearchCode('');
    const initial = { page: 0, pageSize: 20 };
    setPaginationModel(initial);
    setLoading(true);
    gradingService
      .getAutoMarkingResults({ ...scopeParams(), examinee_test_code: undefined, page: initial.page, pageSize: initial.pageSize })
      .then((res) => applyListResult(res.data.data))
      .catch((e) =>
        openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } })
      )
      .finally(() => setLoading(false));
  };

  // ---- Popup "Chi tiết bài thi" ----
  const openDetail = async (examineeTestCode) => {
    setDetailCode(examineeTestCode);
    setDetailLoading(true);
    setDetailItems([]);
    try {
      const res = await gradingService.getAutoMarkingExamDetail(examineeTestCode);
      setDetailItems(res.data.data.items);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được chi tiết bài thi', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailCode(null);
    setDetailItems([]);
  };

  const handleToggleTlnResult = async (row, checked) => {
    try {
      const res = await gradingService.overrideAutoMarkingResult(row.answer_key_id, checked);
      setDetailItems((prev) =>
        prev.map((item) =>
          item.answer_key_id === row.answer_key_id ? { ...item, is_correct: res.data.data.is_correct, score: res.data.data.score } : item
        )
      );
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Cập nhật thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  // ---- Popup xem nội dung câu hỏi ----
  const handleViewQuestion = async (questionId) => {
    setViewLoading(true);
    setViewDetail({ loading: true });
    try {
      const res = await gradingService.getAnswerKeyDetail(questionId);
      setViewDetail(res.data.data);
    } catch (e) {
      setViewDetail(null);
      openSnackbar({ open: true, message: e?.message || 'Không tải được nội dung câu hỏi', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setViewLoading(false);
    }
  };

  // ---- "Chấm lại" 1 bài thi ----
  const doRegrade = async () => {
    const code = confirmRegradeCode;
    setConfirmRegradeCode(null);
    setRegrading(true);
    try {
      const res = await withLoading(() => gradingService.regradeExaminee(code), 'Đang chấm lại... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      if (hasSearched) fetchResults(paginationModel);
      if (detailCode === code) openDetail(code);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Chấm lại thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setRegrading(false);
    }
  };

  const columns = [
    { field: 'examinee_test_code', headerName: 'Mã phách', flex: 1, minWidth: 160 },
    {
      field: 'council_code',
      headerName: 'Hội đồng thi',
      flex: 1,
      minWidth: 180,
      valueGetter: (value) => councils.find((c) => c.code === value)?.desc || value
    },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 140 },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    {
      field: 'is_graded',
      headerName: 'Trạng thái',
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'Đã chấm' : 'Chưa chấm'}
          sx={{
            color: '#fff',
            bgcolor: params.value ? '#2e7d32' : '#d32f2f'
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Chi tiết">
            <IconButton size="small" sx={{ color: '#1976d2' }} onClick={() => openDetail(params.row.examinee_test_code)}>
              <EyeOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chấm lại">
            <IconButton size="small" sx={{ color: '#d32f2f' }} onClick={() => setConfirmRegradeCode(params.row.examinee_test_code)}>
              <ReloadOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const renderResultIcon = (row) => {
    if (row.question_type_id === 5) {
      if (row.grading_status === 'DA_CHAM') return <CheckCircleFilled style={{ color: '#2e7d32', fontSize: 18 }} />;
      if (row.grading_status === 'DANG_CHAM') return <ClockCircleFilled style={{ color: '#ed6c02', fontSize: 18 }} />;
      return <CloseCircleFilled style={{ color: '#d32f2f', fontSize: 18 }} />;
    }
    if (row.is_correct === null) return <Typography color="text.secondary">-</Typography>;
    const max = row.max_score ?? 0;
    const score = row.score ?? 0;
    if (max > 0 && score >= max) return <CheckCircleFilled style={{ color: '#2e7d32', fontSize: 18 }} />;
    if (score > 0) return <MinusCircleFilled style={{ color: '#ed6c02', fontSize: 18 }} />;
    return <CloseCircleFilled style={{ color: '#d32f2f', fontSize: 18 }} />;
  };

  // 'zero' | 'full' | 'partial' | null — câu tự luận highlight theo tiến độ chấm (chưa/đang/đã chấm),
  // câu trắc nghiệm/trả lời ngắn highlight theo điểm đạt được so với điểm tối đa.
  const getScoreStatus = (row) => {
    if (row.question_type_id === 5) {
      if (row.grading_status === 'DA_CHAM') return 'full';
      if (row.grading_status === 'DANG_CHAM') return 'partial';
      return 'zero';
    }
    const score = row.score;
    if (score === null || score === undefined) return null;
    const max = row.max_score ?? 0;
    if (score <= 0) return 'zero';
    if (max > 0 && score >= max) return 'full';
    return 'partial';
  };

  const ROW_HIGHLIGHT_BG = { zero: 'rgba(211, 47, 47, 0.12)', full: 'rgba(46, 125, 50, 0.12)', partial: 'rgba(237, 108, 2, 0.16)' };

  return (
    <MainCard title="Chấm tự động — Trắc nghiệm & Trả lời ngắn" content={false}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Alert severity="info">Chấm tự động chỉ áp dụng cho câu trắc nghiệm 1 đáp án / nhiều đáp án / trả lời ngắn</Alert>

        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Hội đồng thi"
            value={councilCode}
            onChange={(e) => handleCouncilChange(e.target.value)}
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
            disabled={!councilCode}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">-- Tất cả môn thi --</MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleViewResults}>
            Xem kết quả
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutlined />} onClick={handleRunAutoMarking}>
            Chấm tự động
          </Button>
        </Stack>

        {hasSearched && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Tìm theo mã phách"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              sx={{ maxWidth: 320 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleViewResults}>
                      <SearchOutlined />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {searchCode && (
              <Button size="small" onClick={handleClearSearch}>
                Huỷ
              </Button>
            )}
          </Stack>
        )}

        {!hasSearched ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn Hội đồng thi (bắt buộc), thu hẹp thêm nếu cần, rồi bấm &quot;Xem kết quả&quot; hoặc &quot;Chấm tự động&quot;
          </Typography>
        ) : (
          <>
            {stats && (
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                <Chip label={`Tổng: ${stats.total} bài`} />
                <Chip label={`Đã chấm: ${stats.graded}`} sx={{ color: '#fff', bgcolor: '#2e7d32' }} />
                <Chip label={`Chưa chấm: ${stats.ungraded}`} sx={{ color: '#fff', bgcolor: '#d32f2f' }} />
              </Stack>
            )}
            <DataGrid
              autoHeight
              rows={rows}
              getRowId={(row) => row.examinee_test_code}
              columns={columns}
              rowCount={rowCount}
              loading={loading}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationChange}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
            />
          </>
        )}
      </Stack>

      {/* Popup "Chi tiết bài thi" */}
      <Dialog open={!!detailCode} onClose={closeDetail} fullWidth maxWidth="lg">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <span>Chi tiết bài thi — Mã phách: {detailCode}</span>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<ReloadOutlined />}
              onClick={() => setConfirmRegradeCode(detailCode)}
            >
              Chấm lại
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Typography color="text.secondary">Đang tải...</Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Kết quả</TableCell>
                    <TableCell align="center">Vị trí</TableCell>
                    <TableCell>Mã câu hỏi</TableCell>
                    <TableCell>Loại câu hỏi</TableCell>
                    <TableCell>Loại đáp án</TableCell>
                    <TableCell align="center">Đáp án đúng</TableCell>
                    <TableCell align="center">Đáp án thí sinh</TableCell>
                    <TableCell align="center">Điểm tối đa</TableCell>
                    <TableCell align="center">Điểm đạt được</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailItems.map((row) => (
                    <TableRow key={row.answer_key_id} sx={{ bgcolor: ROW_HIGHLIGHT_BG[getScoreStatus(row)] }}>
                      <TableCell align="center">{renderResultIcon(row)}</TableCell>
                      <TableCell align="center">{row.matrix_location}</TableCell>
                      <TableCell>
                        <Link component="button" underline="hover" onClick={() => handleViewQuestion(row.question_id)}>
                          {row.question_code}
                        </Link>
                      </TableCell>
                      <TableCell>{QUESTION_TYPE_LABELS[row.question_type_id] || row.question_type_id}</TableCell>
                      <TableCell>{row.question_type_id === 4 ? ANSWER_TYPE_LABELS[row.answer_type] || row.answer_type : '-'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {row.correct_answer || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ fontStyle: 'italic' }}>
                        {row.examinee_answer || '-'}
                      </TableCell>
                      <TableCell align="center">{row.max_score ?? '-'}</TableCell>
                      <TableCell align="center">
                        {row.question_type_id === 5 ? GRADING_STATUS_LABELS[row.grading_status] : (row.score ?? '-')}
                      </TableCell>
                      <TableCell>
                        {row.question_type_id === 4 && (
                          <Tooltip title={row.is_correct ? 'Đang đúng — bấm để chuyển thành sai' : 'Đang sai — bấm để chuyển thành đúng'}>
                            <Switch
                              size="small"
                              checked={!!row.is_correct}
                              onChange={(e) => handleToggleTlnResult(row, e.target.checked)}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

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

      {/* Xác nhận "Chấm lại" */}
      <Dialog open={!!confirmRegradeCode} onClose={() => setConfirmRegradeCode(null)}>
        <DialogTitle>Chấm lại bài thi</DialogTitle>
        <DialogContent>
          <Typography>
            Chấm tự động lại toàn bộ câu trắc nghiệm/trả lời ngắn của bài <b>{confirmRegradeCode}</b>, ghi đè kết quả hiện có (kể cả các câu
            đã điều chỉnh tay). Bạn có chắc chắn muốn tiếp tục?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRegradeCode(null)}>Huỷ</Button>
          <Button variant="contained" color="error" onClick={doRegrade} disabled={regrading}>
            Xác nhận chấm lại
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default AutoMarkingPage;
