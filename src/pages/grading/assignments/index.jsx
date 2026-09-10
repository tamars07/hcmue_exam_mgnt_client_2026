import { useEffect, useState } from 'react';

// material-ui
import { Alert, Box, Button, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

// ==============================|| B6 - PHÂN BÀI CHẤM TỰ LUẬN ||============================== //

const AssignmentsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();

  // Gán/bớt bài theo cặp cụ thể
  const [pairs, setPairs] = useState([]);
  const [pairId, setPairId] = useState('');
  const [count, setCount] = useState(10);
  const [startAt, setStartAt] = useState('');
  const [finishAt, setFinishAt] = useState('');

  // Phân đều
  const [distSubjectId, setDistSubjectId] = useState('');
  const [distCouncilTurnCode, setDistCouncilTurnCode] = useState('');
  const [distStartAt, setDistStartAt] = useState('');
  const [distFinishAt, setDistFinishAt] = useState('');

  useEffect(() => {
    gradingService
      .getExaminerPairs({ page: 0, pageSize: 200 })
      .then((res) => setPairs(res.data.data.items))
      .catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!pairId || !startAt || !finishAt) {
      return openSnackbar({ open: true, message: 'Chọn cặp và nhập đủ thời hạn', variant: 'alert', alert: { color: 'warning' } });
    }
    try {
      const res = await withLoading(
        () => gradingService.assignToPair(pairId, { count: Number(count), start_at: startAt, finish_at: finishAt }),
        'Đang gán bài... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Gán bài thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleUnassign = async () => {
    if (!pairId) {
      return openSnackbar({ open: true, message: 'Chọn cặp giám khảo', variant: 'alert', alert: { color: 'warning' } });
    }
    try {
      const res = await withLoading(
        () => gradingService.unassignFromPair(pairId, { count: Number(count) }),
        'Đang rút bài... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Rút bài thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleAutoDistribute = async () => {
    if (!distSubjectId || !distCouncilTurnCode.trim() || !distStartAt || !distFinishAt) {
      return openSnackbar({ open: true, message: 'Nhập đủ thông tin', variant: 'alert', alert: { color: 'warning' } });
    }
    try {
      const res = await withLoading(
        () =>
          gradingService.autoDistributeAssignments({
            subject_id: distSubjectId,
            council_turn_code: distCouncilTurnCode.trim(),
            start_at: distStartAt,
            finish_at: distFinishAt
          }),
        'Đang phân đều bài chấm... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Phân đều thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Stack spacing={3}>
      <MainCard title="Gán / bớt bài cho 1 cặp giám khảo cụ thể">
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            Bấm &quot;Gán thêm&quot; nhiều lần để tăng dần số bài của 1 cặp. &quot;Rút bớt&quot; chỉ rút lại được các bài chưa giám khảo nào
            chấm.
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
            <TextField
              select
              size="small"
              label="Cặp giám khảo"
              value={pairId}
              onChange={(e) => setPairId(e.target.value)}
              sx={{ minWidth: 280 }}
            >
              {pairs.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.code} — {subjects.find((s) => s.id === p.subject_id)?.name || p.subject_id} ({p.no_tests} bài)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              label="Số lượng bài"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              type="date"
              label="Hạn bắt đầu"
              InputLabelProps={{ shrink: true }}
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <TextField
              size="small"
              type="date"
              label="Hạn kết thúc"
              InputLabelProps={{ shrink: true }}
              value={finishAt}
              onChange={(e) => setFinishAt(e.target.value)}
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleAssign}>
              Gán thêm
            </Button>
            <Button variant="outlined" color="warning" onClick={handleUnassign}>
              Rút bớt
            </Button>
          </Stack>
        </Stack>
      </MainCard>

      <Divider />

      <MainCard title="Phân đều bài chấm cho tất cả cặp của 1 môn">
        <Stack spacing={2}>
          <Alert severity="info">Chia đều toàn bộ bài tự luận CHƯA gán của môn/ca thi này cho tất cả cặp giám khảo đã có của môn đó.</Alert>
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
            <TextField
              select
              size="small"
              label="Môn thi"
              value={distSubjectId}
              onChange={(e) => setDistSubjectId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Mã ca thi"
              value={distCouncilTurnCode}
              onChange={(e) => setDistCouncilTurnCode(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              type="date"
              label="Hạn bắt đầu"
              InputLabelProps={{ shrink: true }}
              value={distStartAt}
              onChange={(e) => setDistStartAt(e.target.value)}
            />
            <TextField
              size="small"
              type="date"
              label="Hạn kết thúc"
              InputLabelProps={{ shrink: true }}
              value={distFinishAt}
              onChange={(e) => setDistFinishAt(e.target.value)}
            />
          </Stack>
          <Box>
            <Button variant="contained" onClick={handleAutoDistribute}>
              Phân đều
            </Button>
          </Box>
        </Stack>
      </MainCard>
    </Stack>
  );
};

export default AssignmentsPage;
