import PropTypes from 'prop-types';

// material-ui
import { Alert, Box, Button, Checkbox, FormControlLabel, Grid, Stack, Typography } from '@mui/material';
import { ClockCircleOutlined } from '@ant-design/icons';

// project import
import ExamineeCard from './ExamineeCard';

// ==============================|| GIÁM SÁT KÌ THI - 1 PHÒNG THI ||============================== //

const StatusBox = ({ title, count, color }) => (
  <Box sx={{ textAlign: 'center', color, minWidth: 80 }}>
    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ fontSize: '18px', mt: 0.5 }}>
      {count ?? 0}
    </Typography>
  </Box>
);

StatusBox.propTypes = { title: PropTypes.string, count: PropTypes.number, color: PropTypes.string };

const summarize = (examinees) => ({
  total: examinees.length,
  backup: examinees.filter((e) => e.is_backup).length,
  notLoggedIn: examinees.filter((e) => !e.is_backup && e.status === 'CHƯA ĐĂNG NHẬP').length,
  waiting: examinees.filter((e) => e.status === 'CHỜ THI').length,
  inExam: examinees.filter((e) => e.status === 'ĐANG THI').length,
  submitted: examinees.filter((e) => e.status === 'ĐÃ NỘP BÀI').length
});

const ELIGIBLE_BULK_STATUSES = ['ĐANG THI', 'ĐÃ NỘP BÀI'];

const RoomMonitorSection = ({
  room,
  readOnly,
  selected,
  onToggleSelect,
  onSelectAll,
  onBulkAddTime,
  onBulkRestore,
  onDetail,
  onRestore,
  onAddTime,
  onViewLogs,
  onRestoreFromLog,
  onReset
}) => {
  const examinees = room.examinees || [];
  const stats = summarize(examinees);
  const eligibleExaminees = examinees.filter((ex) => ELIGIBLE_BULK_STATUSES.includes(ex.status));
  const allSelected = eligibleExaminees.length > 0 && selected.length === eligibleExaminees.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ backgroundColor: '#104874', color: '#fff', px: 2, py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
          <Box>
            <Typography variant="h5">Phòng {room.room_name || room.room_code}</Typography>
            <Typography variant="body2">
              Ngày thi: {room.turn_date} — Giờ thi: {room.turn_time}
            </Typography>
          </Box>
          {room.is_active ? (
            <Alert severity="success">Đã kích hoạt{room.activated_at ? ` lúc ${room.activated_at}` : ''}</Alert>
          ) : (
            <Alert severity="warning">Chưa kích hoạt</Alert>
          )}
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="space-around" flexWrap="wrap" rowGap={1} sx={{ backgroundColor: '#333', color: '#fff', py: 1.5 }}>
        <StatusBox title="TỔNG THÍ SINH" count={stats.total} color="#d1373f" />
        <StatusBox title="CHƯA ĐĂNG NHẬP" count={stats.notLoggedIn} color="#eee" />
        <StatusBox title="CHỜ THI" count={stats.waiting} color="#faad14" />
        <StatusBox title="ĐANG THI" count={stats.inExam} color="#00ff0d" />
        <StatusBox title="NỘP BÀI" count={stats.submitted} color="#757de8" />
        <StatusBox title="DỰ PHÒNG" count={stats.backup} color="#ffa39e" />
      </Stack>

      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                disabled={readOnly || eligibleExaminees.length === 0}
                onChange={(e) => onSelectAll(e.target.checked ? eligibleExaminees.map((ex) => ex.username) : [])}
              />
            }
            label="Chọn tất cả (đang thi / đã nộp bài)"
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<ClockCircleOutlined />}
            disabled={readOnly || selected.length === 0}
            onClick={onBulkAddTime}
          >
            Bù giờ đã chọn ({selected.length})
          </Button>
          <Button size="small" variant="outlined" disabled={readOnly || selected.length === 0} onClick={onBulkRestore}>
            Phục hồi đã chọn ({selected.length})
          </Button>
        </Stack>

        {examinees.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            Phòng thi này chưa có thí sinh.
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            {examinees.map((ex) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={ex.username}>
                <ExamineeCard
                  examinee={ex}
                  readOnly={readOnly}
                  selected={selected.includes(ex.username)}
                  onToggleSelect={onToggleSelect}
                  onDetail={onDetail}
                  onRestore={onRestore}
                  onAddTime={onAddTime}
                  onViewLogs={onViewLogs}
                  onRestoreFromLog={onRestoreFromLog}
                  onReset={onReset}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

RoomMonitorSection.propTypes = {
  room: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  selected: PropTypes.array.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onBulkAddTime: PropTypes.func.isRequired,
  onBulkRestore: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onAddTime: PropTypes.func.isRequired,
  onViewLogs: PropTypes.func.isRequired,
  onRestoreFromLog: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

export default RoomMonitorSection;
