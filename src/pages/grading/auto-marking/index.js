import { useState } from 'react';

// material-ui
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { CheckCircleOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

const SCOPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'council', label: 'Theo Hội đồng thi' },
  { value: 'council_turn', label: 'Theo Ca thi' },
  { value: 'subject', label: 'Theo Môn thi' },
  { value: 'examinee', label: 'Theo Thí sinh (mã phách)' }
];

// ==============================|| B3 - CHẤM TỰ ĐỘNG ||============================== //

const AutoMarkingPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [scope, setScope] = useState('all');
  const [councilCode, setCouncilCode] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examineeTestCode, setExamineeTestCode] = useState('');
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    try {
      let res;
      if (scope === 'all') {
        res = await gradingService.autoMarkAll();
      } else if (scope === 'council') {
        if (!councilCode.trim()) return warnMissing('mã hội đồng thi');
        res = await gradingService.autoMarkByCouncil(councilCode.trim());
      } else if (scope === 'council_turn') {
        if (!councilTurnCode.trim()) return warnMissing('mã ca thi');
        res = await gradingService.autoMarkByCouncilTurn(councilTurnCode.trim());
      } else if (scope === 'subject') {
        if (!subjectId) return warnMissing('môn thi');
        res = await gradingService.autoMarkBySubject(subjectId);
      } else if (scope === 'examinee') {
        if (!examineeTestCode.trim()) return warnMissing('mã phách');
        res = await gradingService.autoMarkByExaminee(examineeTestCode.trim());
      }
      const response = await withLoading(() => res, 'Đang chấm... Vui lòng chờ');
      setResult(response.data.data);
      openSnackbar({ open: true, message: response.data.message, variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Chấm thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const warnMissing = (field) => openSnackbar({ open: true, message: `Chưa nhập ${field}`, variant: 'alert', alert: { color: 'warning' } });

  return (
    <MainCard title="Chấm tự động — Trắc nghiệm & Trả lời ngắn">
      <Stack spacing={3}>
        <Alert severity="info">
          Chỉ áp dụng cho câu trắc nghiệm 1 đáp án / nhiều đáp án / trả lời ngắn. Câu tự luận luôn do giám khảo chấm, không nằm trong nút
          này. Đáp án được nhập ở B2 <b>không</b> tự động chấm ngay — phải bấm nút bên dưới.
        </Alert>

        <TextField select label="Phạm vi chấm" value={scope} onChange={(e) => setScope(e.target.value)} sx={{ maxWidth: 320 }}>
          {SCOPES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>

        {scope === 'council' && (
          <TextField label="Mã hội đồng thi" value={councilCode} onChange={(e) => setCouncilCode(e.target.value)} sx={{ maxWidth: 320 }} />
        )}
        {scope === 'council_turn' && (
          <TextField
            label="Mã ca thi"
            value={councilTurnCode}
            onChange={(e) => setCouncilTurnCode(e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        )}
        {scope === 'subject' && (
          <TextField select label="Môn thi" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} sx={{ maxWidth: 320 }}>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {scope === 'examinee' && (
          <TextField
            label="Mã phách"
            value={examineeTestCode}
            onChange={(e) => setExamineeTestCode(e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        )}

        <Box>
          <Button variant="contained" size="large" startIcon={<CheckCircleOutlined />} onClick={handleRun}>
            Chấm
          </Button>
        </Box>

        {result && (
          <Alert severity="success">
            <Typography>
              Đã chấm <b>{result.graded_count}</b> câu.
            </Typography>
          </Alert>
        )}
      </Stack>
    </MainCard>
  );
};

export default AutoMarkingPage;
