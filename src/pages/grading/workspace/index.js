import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingExaminerService from 'services/grading-examiner.service';

const TABS = [
  { key: 'chua_cham', label: 'Chưa chấm', color: 'default' },
  { key: 'cho_ket_qua', label: 'Chờ kết quả', color: 'warning' },
  { key: 'da_chot', label: 'Đã chốt điểm', color: 'success' }
];

const STATUS_BADGE = {
  PENDING: { label: 'Chưa chấm', color: 'default' },
  NEED_REGRADE: { label: 'Đang chờ chấm lại (round 2)', color: 'warning' },
  NEED_THIRD: { label: 'Đang chờ giám khảo thứ 3', color: 'error' },
  FINALIZED: { label: 'Đã chốt điểm', color: 'success' }
};

// ==============================|| TRANG GIÁM KHẢO - CHẤM TỰ LUẬN ||============================== //
// Thay thế hoidong.js cũ ở app thí sinh — giám khảo đăng nhập trực tiếp vào app admin này.

const GradingWorkspacePage = () => {
  const [tab, setTab] = useState('chua_cham');
  const [groups, setGroups] = useState({ chua_cham: [], cho_ket_qua: [], da_chot: [] });
  const [selectedTestCode, setSelectedTestCode] = useState(null);
  const [detail, setDetail] = useState(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await gradingExaminerService.getAssignments();
      setGroups(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách bài', variant: 'alert', alert: { color: 'error' } });
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openPaper = useCallback(async (testCode) => {
    setSelectedTestCode(testCode);
    try {
      const res = await gradingExaminerService.getAssignmentDetail(testCode);
      setDetail(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được bài làm', variant: 'alert', alert: { color: 'error' } });
    }
  }, []);

  const handleScoreChange = async (stateId, criteriaId, score) => {
    try {
      await gradingExaminerService.submitRubricScore({ state_id: stateId, rubric_criteria_id: criteriaId, score });
      openSnackbar({ open: true, message: 'Đã lưu điểm', variant: 'alert', alert: { color: 'success' } });
      // Nạp lại chi tiết bài (điểm/trạng thái có thể vừa đổi — vd đủ điều kiện chốt điểm) + danh sách
      if (selectedTestCode) openPaper(selectedTestCode);
      fetchAssignments();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu điểm thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const currentList = groups[tab] || [];
  // Gom theo mã phách để hiển thị danh sách "bài" thay vì từng câu rời rạc
  const papers = Object.values(
    currentList.reduce((acc, item) => {
      acc[item.examinee_test_code] = acc[item.examinee_test_code] || { examinee_test_code: item.examinee_test_code, questions: [] };
      acc[item.examinee_test_code].questions.push(item);
      return acc;
    }, {})
  );

  return (
    <MainCard title="Chấm bài tự luận" content={false}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ minHeight: 600 }}>
        <Box sx={{ width: { xs: '100%', md: 340 }, borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
            {TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={`${t.label} (${(groups[t.key] || []).length})`} />
            ))}
          </Tabs>
          <List sx={{ maxHeight: 600, overflow: 'auto' }}>
            {papers.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                Không có bài nào ở mục này.
              </Typography>
            )}
            {papers.map((p) => (
              <ListItemButton
                key={p.examinee_test_code}
                selected={selectedTestCode === p.examinee_test_code}
                onClick={() => openPaper(p.examinee_test_code)}
              >
                <ListItemText primary={p.examinee_test_code} secondary={p.questions.map((q) => `Câu ${q.matrix_location}`).join(', ')} />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ flex: 1, p: 3 }}>
          {!detail ? (
            <Typography color="textSecondary">Chọn 1 bài ở danh sách bên trái để chấm.</Typography>
          ) : (
            <Stack spacing={3}>
              <Typography variant="h5">Mã phách: {detail.examinee_test_code}</Typography>
              {detail.questions.map((q) => (
                <Paper key={q.state_id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">
                        Câu {q.matrix_location} — vai trò của bạn: {q.my_role}
                      </Typography>
                      <Chip
                        size="small"
                        label={STATUS_BADGE[q.status]?.label || q.status}
                        color={STATUS_BADGE[q.status]?.color || 'default'}
                      />
                    </Stack>

                    {q.question_content && (
                      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }} dangerouslySetInnerHTML={{ __html: q.question_content }} />
                    )}

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Bài làm của thí sinh
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                        {q.examinee_answer || '(không có nội dung)'}
                      </Typography>
                    </Box>

                    <Divider />

                    <Typography variant="subtitle2">Chấm điểm rubric</Typography>
                    {q.rubric_criterias.map((c) => (
                      <Stack key={c.id} direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ flex: 1 }}>
                          {c.name}{' '}
                          <Typography component="span" variant="caption" color="textSecondary">
                            ({c.min_score}-{c.max_score} điểm)
                          </Typography>
                        </Typography>
                        <Select
                          size="small"
                          value={c.my_score ?? ''}
                          onChange={(e) => handleScoreChange(q.state_id, c.id, Number(e.target.value))}
                          disabled={q.status === 'FINALIZED'}
                          sx={{ minWidth: 120 }}
                        >
                          {c.scores.map((score) => (
                            <MenuItem key={score} value={score}>
                              {score}
                            </MenuItem>
                          ))}
                        </Select>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </MainCard>
  );
};

export default GradingWorkspacePage;
