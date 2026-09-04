import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Chip,
  Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { UploadOutlined, ImportOutlined, EyeOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

// ==============================|| B1 - NHẬP DỮ LIỆU CHẤM THI ||============================== //

const ImportDataPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [files, setFiles] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  const [councils, setCouncils] = useState([]);
  const [councilTurns, setCouncilTurns] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [phachSummary, setPhachSummary] = useState(null);

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [overviewPaginationModel, setOverviewPaginationModel] = useState({ page: 0, pageSize: 10 });

  useEffect(() => {
    councilMgmtService
      .getLookup('councils')
      .then((res) => setCouncils(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCouncilTurnCode('');
    setSubjectId('');
    if (!councilCode) {
      setCouncilTurns([]);
      return;
    }
    councilMgmtService
      .getLookup('council_turns', { council_code: councilCode })
      .then((res) => setCouncilTurns(res.data.data))
      .catch(() => {});
  }, [councilCode]);

  useEffect(() => {
    setSubjectId('');
  }, [councilTurnCode]);

  const handleImportBak = async () => {
    if (!files.length) {
      openSnackbar({ open: true, message: 'Chưa chọn file .bak', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      const res = await withLoading(() => gradingService.importBak(files), 'Đang gộp dữ liệu từ .bak... Vui lòng chờ');
      setImportSummary(res.data.data);
      openSnackbar({ open: true, message: res.data.message || 'Đã gộp dữ liệu', variant: 'alert', alert: { color: 'success' } });
      setFiles([]);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Gộp dữ liệu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleGeneratePhach = async () => {
    if (!councilCode) {
      openSnackbar({ open: true, message: 'Chọn Hội đồng thi', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      const res = await withLoading(
        () =>
          gradingService.generatePhach({
            council_code: councilCode,
            council_turn_code: councilTurnCode || undefined,
            subject_id: subjectId || undefined
          }),
        'Đang sinh mã phách... Vui lòng chờ'
      );
      setPhachSummary(res.data.data);
      openSnackbar({ open: true, message: res.data.message || 'Đã sinh mã phách', variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Sinh mã phách thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const fetchOverview = useCallback(
    async (paginationModel) => {
      setOverviewLoading(true);
      try {
        const res = await gradingService.getPhachOverview({
          council_code: councilCode,
          council_turn_code: councilTurnCode || undefined,
          subject_id: subjectId || undefined,
          page: paginationModel.page,
          pageSize: paginationModel.pageSize
        });
        setOverviewData(res.data.data);
      } catch (e) {
        openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách mã phách', variant: 'alert', alert: { color: 'error' } });
      } finally {
        setOverviewLoading(false);
      }
    },
    [councilCode, councilTurnCode, subjectId]
  );

  const handleOpenOverview = () => {
    if (!councilCode) {
      openSnackbar({ open: true, message: 'Chọn Hội đồng thi', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    const initial = { page: 0, pageSize: 10 };
    setOverviewPaginationModel(initial);
    setOverviewOpen(true);
    fetchOverview(initial);
  };

  const handleOverviewPaginationChange = (model) => {
    setOverviewPaginationModel(model);
    fetchOverview(model);
  };

  const overviewColumns = [
    { field: 'examinee_test_code', headerName: 'Mã phách', width: 220, valueGetter: (value) => value || '(chưa có)' },
    {
      field: 'subject_id',
      headerName: 'Môn thi',
      width: 180,
      valueGetter: (value) => subjects.find((s) => s.id === value)?.name || value
    },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 200 },
    {
      field: 'phach_generated_at',
      headerName: 'Thời điểm tạo mã phách',
      width: 200,
      valueGetter: (value) => (value ? new Date(value).toLocaleString('vi-VN') : '-')
    }
  ];

  const overviewTitle = (() => {
    const parts = [`Hội đồng thi ${councils.find((c) => c.code === councilCode)?.desc || councilCode}`];
    if (councilTurnCode) {
      parts.push(`Ca thi ${councilTurns.find((t) => t.code === councilTurnCode)?.name || councilTurnCode}`);
    }
    if (subjectId) {
      parts.push(`Môn thi ${subjects.find((s) => s.id === subjectId)?.name || subjectId}`);
    }
    return `Xem mã phách của ${parts.join(' - ')}`;
  })();

  return (
    <Stack spacing={3}>
      <MainCard title="TH1 — Phục hồi file .sql (chấm riêng 1 ca thi)">
        <Alert severity="info">
          Trường hợp này dùng tính năng có sẵn ở khu vực <b>Quản trị hệ thống → Quản lý Database</b>: phục hồi file .sql thành 1 database
          mới rồi chuyển hệ thống sang dùng database đó. Sau khi chuyển xong, quay lại đây để &quot;Sinh mã phách&quot; bên dưới.
        </Alert>
      </MainCard>

      <MainCard title="TH2 — Gộp dữ liệu bài làm từ nhiều file .bak">
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            Chọn 1 hoặc nhiều file .bak (mỗi file xuất từ 1 hội đồng/ca thi ở màn hình &quot;Quản lý dữ liệu&quot; của điểm trưởng). Dữ liệu
            dùng chung (đề thi, rubric...) sẽ tự động bỏ qua nếu đã có, dữ liệu riêng thí sinh sẽ được gộp vào.
          </Typography>
          <Button component="label" variant="outlined" startIcon={<UploadOutlined />} sx={{ alignSelf: 'flex-start' }}>
            Chọn file .bak
            <input type="file" accept=".bak" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </Button>
          {files.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {files.map((f, i) => (
                <Chip key={i} label={f.name} onDelete={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} />
              ))}
            </Stack>
          )}
          <Box>
            <Button variant="contained" startIcon={<ImportOutlined />} onClick={handleImportBak} disabled={!files.length}>
              Gộp dữ liệu
            </Button>
          </Box>
          {importSummary && (
            <Box component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(importSummary, null, 2)}
            </Box>
          )}
        </Stack>
      </MainCard>

      <Divider />

      <MainCard title="Sinh mã phách + dữ liệu chấm thi">
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            Chọn Hội đồng thi (bắt buộc) — có thể thu hẹp thêm bằng Ca thi rồi Môn thi. Chỉ chọn Hội đồng thi: sinh cho toàn bộ hội đồng.
            Chọn thêm Ca thi: sinh cho ca thi đó (mọi môn). Chọn thêm Môn thi: chỉ sinh đúng môn đó trong ca thi đã chọn. Chỉ quét bài
            CHƯA có mã phách — an toàn để bấm lại nhiều lần.
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={2}>
            <TextField
              select
              size="small"
              label="Hội đồng thi"
              value={councilCode}
              onChange={(e) => setCouncilCode(e.target.value)}
              sx={{ minWidth: 260 }}
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
              sx={{ minWidth: 220 }}
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
              disabled={!councilTurnCode}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">-- Tất cả môn thi --</MenuItem>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleGeneratePhach}>
              Tạo mã phách
            </Button>
            <Button variant="outlined" startIcon={<EyeOutlined />} onClick={handleOpenOverview}>
              Xem mã phách
            </Button>
          </Stack>
          {phachSummary && (
            <Alert severity="success">
              Đã sinh <b>{phachSummary.generated_phach}</b> mã phách, tạo <b>{phachSummary.created_answer_keys}</b> dòng dữ liệu chấm thi.
            </Alert>
          )}
        </Stack>
      </MainCard>

      <Typography variant="caption" color="textSecondary">
        Bước tiếp theo: <Link href="/grading/answer-keys">Nhập đáp án &amp; Rubric</Link>
      </Typography>

      <Dialog open={overviewOpen} onClose={() => setOverviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{overviewTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {overviewData && (
              <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={1}>
                <Chip label={`Tổng số bài: ${overviewData.stats.total}`} />
                <Chip color="success" label={`Đã có mã phách: ${overviewData.stats.with_phach}`} />
                <Chip color="warning" label={`Chưa có mã phách: ${overviewData.stats.without_phach}`} />
              </Stack>
            )}
            <DataGrid
              autoHeight
              rows={overviewData?.items || []}
              getRowId={(row) => row.id}
              columns={overviewColumns}
              rowCount={overviewData?.total || 0}
              loading={overviewLoading}
              paginationMode="server"
              paginationModel={overviewPaginationModel}
              onPaginationModelChange={handleOverviewPaginationChange}
              pageSizeOptions={[10, 20, 50]}
              disableRowSelectionOnClick
            />
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default ImportDataPage;
