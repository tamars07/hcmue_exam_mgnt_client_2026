import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChartOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

const QUESTION_TYPE_LABELS = { 1: 'Trắc nghiệm 1 đáp án', 2: 'Trắc nghiệm nhiều đáp án', 4: 'Trả lời ngắn', 5: 'Tự luận' };

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

// ==============================|| B8 - TỔNG HỢP ĐIỂM ||============================== //

const ResultsPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilTurns, setCouncilTurns] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formulas, setFormulas] = useState([]);

  const [councilCode, setCouncilCode] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scoreFormulaId, setScoreFormulaId] = useState('');

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [hasSearched, setHasSearched] = useState(false);

  const [confirmAggregate, setConfirmAggregate] = useState(false);
  const [exportDialog, setExportDialog] = useState(null); // 'summary' | null
  const [withPhach, setWithPhach] = useState(true);

  const [detailCode, setDetailCode] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);

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
    setScoreFormulaId('');
    setFormulas([]);
    if (!value) return;
    councilMgmtService
      .getLookup('council_turns', { council_code: value })
      .then((res) => setCouncilTurns(res.data.data))
      .catch(() => {});
  };

  const handleTurnChange = (value) => {
    setCouncilTurnCode(value);
    setSubjectId('');
    setSubjects([]);
    setScoreFormulaId('');
    setFormulas([]);
    if (!value) return;
    gradingService
      .getResultsSubjects({ council_code: councilCode, council_turn_code: value })
      .then((res) => setSubjects(res.data.data))
      .catch(() => {});
  };

  const handleSubjectChange = (value) => {
    setSubjectId(value);
    setScoreFormulaId('');
    setFormulas([]);
    if (!value) return;
    gradingService
      .getScoreFormulas({ subject_id: value, pageSize: 100 })
      .then((res) => setFormulas(res.data.data.items))
      .catch(() => {});
  };

  const scopeParams = useCallback(
    () => ({
      council_code: councilCode || undefined,
      council_turn_code: councilTurnCode,
      subject_id: subjectId || undefined
    }),
    [councilCode, councilTurnCode, subjectId]
  );

  const applyListResult = (data) => {
    setRows(data.items);
    setRowCount(data.total);
    setHasSearched(true);
  };

  const fetchResults = useCallback(
    async (model) => {
      if (!councilTurnCode) {
        openSnackbar({ open: true, message: 'Chọn Hội đồng thi và Ca thi', variant: 'alert', alert: { color: 'warning' } });
        return;
      }
      setLoading(true);
      try {
        const res = await gradingService.getResultsSummary({ ...scopeParams(), page: model.page, pageSize: model.pageSize });
        applyListResult(res.data.data);
      } catch (e) {
        openSnackbar({ open: true, message: e?.message || 'Không tải được bảng điểm', variant: 'alert', alert: { color: 'error' } });
      } finally {
        setLoading(false);
      }
    },
    [councilTurnCode, scopeParams]
  );

  const handleViewResults = () => {
    const initial = { page: 0, pageSize: 20 };
    setPaginationModel(initial);
    fetchResults(initial);
  };

  const handlePaginationChange = (model) => {
    setPaginationModel(model);
    if (hasSearched) fetchResults(model);
  };

  const handleAggregate = async () => {
    setConfirmAggregate(false);
    if (!councilTurnCode || !subjectId || !scoreFormulaId) {
      return openSnackbar({
        open: true,
        message: 'Chọn Hội đồng thi, Ca thi, Môn thi và Công thức tính điểm',
        variant: 'alert',
        alert: { color: 'warning' }
      });
    }
    try {
      const res = await withLoading(
        () =>
          gradingService.aggregateResults({
            council_code: councilCode,
            council_turn_code: councilTurnCode,
            subject_id: subjectId,
            score_formula_id: scoreFormulaId
          }),
        'Đang tổng hợp điểm... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      const initial = { page: 0, pageSize: 20 };
      setPaginationModel(initial);
      fetchResults(initial);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Tổng hợp điểm thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleExportSummary = async () => {
    setExportDialog(null);
    try {
      const res = await withLoading(
        () => gradingService.downloadResultsSummaryXlsx({ ...scopeParams(), with_phach: withPhach ? 1 : 0 }),
        'Đang xuất file... Vui lòng chờ'
      );
      downloadBlob(res.data, `bang-diem-tong-hop-${councilTurnCode}.xlsx`);
    } catch (e) {
      openSnackbar({ open: true, message: 'Xuất file thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleExportDetail = async () => {
    if (!councilTurnCode) {
      return openSnackbar({ open: true, message: 'Chọn Hội đồng thi và Ca thi', variant: 'alert', alert: { color: 'warning' } });
    }
    try {
      const res = await withLoading(() => gradingService.downloadResultsDetailXlsx(scopeParams()), 'Đang xuất file... Vui lòng chờ');
      downloadBlob(res.data, `bang-diem-chi-tiet-${councilTurnCode}.xlsx`);
    } catch (e) {
      openSnackbar({ open: true, message: 'Xuất file thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const openDetail = async (examineeTestCode) => {
    setDetailCode(examineeTestCode);
    setDetailLoading(true);
    setDetailItems([]);
    try {
      const res = await gradingService.getResultDetail(examineeTestCode);
      setDetailItems(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được điểm chi tiết', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { field: 'examinee_code', headerName: 'Số báo danh', width: 130 },
    { field: 'examinee_name', headerName: 'Họ tên thí sinh', flex: 1, minWidth: 180 },
    { field: 'id_card_number', headerName: 'CCCD', width: 140 },
    { field: 'birthday', headerName: 'Ngày sinh', width: 120 },
    { field: 'council_name', headerName: 'Hội đồng thi', flex: 1, minWidth: 160 },
    { field: 'council_turn_name', headerName: 'Ca thi', width: 130 },
    { field: 'room_name', headerName: 'Phòng thi', width: 110 },
    { field: 'subject_name', headerName: 'Môn thi', width: 130 },
    { field: 'final_score', headerName: 'Điểm tổng hợp', width: 130 },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Xem điểm chi tiết">
          <IconButton size="small" sx={{ color: '#1976d2' }} onClick={() => openDetail(params.row.examinee_test_code)}>
            <EyeOutlined />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <MainCard title="Tổng hợp điểm" content={false}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Hội đồng thi"
            value={councilCode}
            onChange={(e) => handleCouncilChange(e.target.value)}
            sx={{ minWidth: 220 }}
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
            onChange={(e) => handleTurnChange(e.target.value)}
            disabled={!councilCode}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">-- Chọn ca thi --</MenuItem>
            {councilTurns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.name || t.code}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<EyeOutlined />} onClick={handleViewResults}>
            Xem bảng điểm
          </Button>
          <Button startIcon={<DownloadOutlined />} onClick={() => setExportDialog('summary')}>
            Xuất bảng điểm tổng hợp
          </Button>
          <Button startIcon={<DownloadOutlined />} onClick={handleExportDetail}>
            Xuất bảng điểm chi tiết
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Môn thi (để tổng hợp điểm)"
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!councilTurnCode}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">-- Chọn môn thi --</MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Công thức tính điểm"
            value={scoreFormulaId}
            onChange={(e) => setScoreFormulaId(e.target.value)}
            disabled={!subjectId}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">-- Chọn công thức --</MenuItem>
            {formulas.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.name || `Công thức #${f.id}`} ({f.test_form?.name})
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            color="success"
            startIcon={<BarChartOutlined />}
            onClick={() => setConfirmAggregate(true)}
            disabled={!subjectId || !scoreFormulaId}
          >
            Tổng hợp điểm
          </Button>
        </Stack>

        {!hasSearched ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn Hội đồng thi + Ca thi rồi bấm &quot;Xem bảng điểm&quot;, hoặc chọn thêm Môn thi + Công thức tính điểm để &quot;Tổng hợp
            điểm&quot;
          </Typography>
        ) : (
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
        )}
      </Stack>

      {/* Xác nhận Tổng hợp điểm */}
      <Dialog open={confirmAggregate} onClose={() => setConfirmAggregate(false)}>
        <DialogTitle>Tổng hợp điểm</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Thao tác sẽ tính lại điểm tổng hợp cho toàn bộ bài thi môn đã chọn trong ca thi này theo công thức đã chọn, ghi đè điểm tổng hợp
            hiện có (nếu đã từng tổng hợp trước đó).
          </Alert>
          <Typography>Bạn có chắc chắn muốn tiếp tục?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAggregate(false)}>Huỷ</Button>
          <Button variant="contained" color="success" onClick={handleAggregate}>
            Xác nhận tổng hợp điểm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chọn kiểu xuất bảng điểm tổng hợp */}
      <Dialog open={exportDialog === 'summary'} onClose={() => setExportDialog(null)}>
        <DialogTitle>Xuất bảng điểm tổng hợp</DialogTitle>
        <DialogContent>
          <RadioGroup value={withPhach ? '1' : '0'} onChange={(e) => setWithPhach(e.target.value === '1')}>
            <FormControlLabel value="1" control={<Radio />} label="Bảng điểm có cột mã phách" />
            <FormControlLabel value="0" control={<Radio />} label="Bảng điểm không có cột mã phách" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(null)}>Huỷ</Button>
          <Button variant="contained" onClick={handleExportSummary}>
            Xuất file
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup xem điểm chi tiết */}
      <Dialog open={!!detailCode} onClose={() => setDetailCode(null)} fullWidth maxWidth="sm">
        <DialogTitle>Điểm chi tiết — Mã phách: {detailCode}</DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Typography color="text.secondary">Đang tải...</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Vị trí</TableCell>
                  <TableCell>Mã câu hỏi</TableCell>
                  <TableCell>Loại câu hỏi</TableCell>
                  <TableCell align="center">Điểm đạt được</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailItems.map((row) => (
                  <TableRow key={row.matrix_location}>
                    <TableCell align="center">{row.matrix_location}</TableCell>
                    <TableCell>{row.question_code}</TableCell>
                    <TableCell>{QUESTION_TYPE_LABELS[row.question_type_id] || row.question_type_id}</TableCell>
                    <TableCell align="center">{row.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailCode(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default ResultsPage;
