import { useState } from 'react';

// material-ui
import { Alert, Box, Button, Divider, Stack, TextField, Typography, Chip, Link } from '@mui/material';
import { UploadOutlined, ImportOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| B1 - NHẬP DỮ LIỆU CHẤM THI ||============================== //

const ImportDataPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [files, setFiles] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [phachSummary, setPhachSummary] = useState(null);

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
    if (!councilTurnCode.trim()) {
      openSnackbar({ open: true, message: 'Nhập mã ca thi', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    try {
      const res = await withLoading(() => gradingService.generatePhach(councilTurnCode.trim()), 'Đang sinh mã phách... Vui lòng chờ');
      setPhachSummary(res.data.data);
      openSnackbar({ open: true, message: res.data.message || 'Đã sinh mã phách', variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Sinh mã phách thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

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
            Dùng chung cho cả TH1 và TH2 — quét toàn bộ bài làm của ca thi CHƯA có mã phách, đánh mã phách và tạo dữ liệu chấm (answer_keys)
            từ đáp án hiện có của ngân hàng câu hỏi. An toàn để bấm lại nhiều lần.
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Mã ca thi (council_turn_code)"
              value={councilTurnCode}
              onChange={(e) => setCouncilTurnCode(e.target.value)}
              sx={{ minWidth: 260 }}
            />
            <Button variant="contained" onClick={handleGeneratePhach}>
              Sinh mã phách
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
    </Stack>
  );
};

export default ImportDataPage;
