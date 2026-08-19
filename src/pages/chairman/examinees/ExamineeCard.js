import PropTypes from 'prop-types';

// material-ui
import { Box, Button, Checkbox, Chip, Paper, Stack, Typography } from '@mui/material';

// ==============================|| GIÁM SÁT KÌ THI - THẺ THÍ SINH ||============================== //
// Layout phỏng theo component Card trong hcmue_client_2026/src/pages/exam/giamthi.js.

const STATUS_BG = {
  'CHƯA ĐĂNG NHẬP': '#ecf0f5',
  'CHỜ THI': 'rgba(255,78,0,.19)',
  'ĐANG THI': 'rgba(0,128,0,.19)',
  'ĐÃ NỘP BÀI': 'rgba(0,0,255,.19)'
};

const STATUS_TEXT = {
  'CHƯA ĐĂNG NHẬP': '#616161',
  'CHỜ THI': 'rgba(255,78,0,.91)',
  'ĐANG THI': 'rgba(0,128,0,.91)',
  'ĐÃ NỘP BÀI': 'rgba(0,0,255,.91)'
};

const getLastUpdateStatus = (lastUpdateTime) => {
  if (!lastUpdateTime) {
    return { color: '#666', bg: 'transparent' };
  }
  try {
    const [datePart, timePart] = lastUpdateTime.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    const lastDate = new Date(year, month - 1, day, hour, minute, second);
    const diffMinutes = (Date.now() - lastDate.getTime()) / 1000 / 60;

    if (diffMinutes >= 45) return { color: '#C62828', bg: 'rgba(198, 40, 40, 0.12)' };
    if (diffMinutes >= 30) return { color: '#ED6C02', bg: 'rgba(237, 108, 2, 0.12)' };
    return { color: '#1B5E20', bg: 'rgba(46, 125, 50, 0.08)' };
  } catch (err) {
    return { color: '#666', bg: 'transparent' };
  }
};

const getProgressColor = (answeredCount, totalQuestions) => {
  if (totalQuestions <= 0) return '#D32F2F';
  const percent = answeredCount / totalQuestions;
  if (percent >= 1) return '#1B5E20';
  if (percent >= 0.7) return '#ED6C02';
  return '#D32F2F';
};

// onRestoreFromLog/onReset (Phục hồi từ nhật ký, Reset kết quả) tạm ẩn khỏi giao diện — không nhận
// nữa ở đây nhưng cha vẫn có thể truyền xuống bình thường, không lỗi gì, chỉ cần thêm lại khi bật.
const ExamineeCard = ({ examinee, readOnly, selected, onToggleSelect, onDetail, onRestore, onAddTime }) => {
  const {
    seat_number: seatNumber,
    status,
    code,
    fullname,
    id_card_number: idCardNumber,
    username,
    subject,
    ip_address: ipAddress,
    answered_count: answeredCountRaw,
    total_questions: totalQuestionsRaw,
    last_update_time: lastUpdateTime,
    is_backup: isBackup
  } = examinee;

  const cardBg = STATUS_BG[status] || '#ecf0f5';
  const textColor = STATUS_TEXT[status] || '#616161';
  const answeredCount = Number(answeredCountRaw || 0);
  const totalQuestions = Number(totalQuestionsRaw || 0);
  const hasProgress = totalQuestions > 0;
  const progressColor = getProgressColor(answeredCount, totalQuestions);
  const lastUpdateStatus = getLastUpdateStatus(lastUpdateTime);
  const hasInteracted = !!ipAddress || status !== 'CHƯA ĐĂNG NHẬP';

  const header = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Checkbox
          size="small"
          checked={selected}
          disabled={readOnly}
          onChange={(e) => onToggleSelect(username, e.target.checked)}
          sx={{ p: 0 }}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Máy {seatNumber}
        </Typography>
        {isBackup && <Chip label="Dự phòng" size="small" color="warning" />}
      </Stack>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="body1">
          <span style={{ color: '#c70000' }}>{subject}</span>
        </Typography>
        {hasProgress && (
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: progressColor, lineHeight: 1.2, mt: 0.3 }}>
            {answeredCount}/{totalQuestions}
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (!hasInteracted) {
    return (
      <Paper sx={{ backgroundColor: cardBg, padding: 2, borderRadius: 2, boxShadow: 2 }}>
        {header}
        <Stack sx={{ mt: 1 }}>
          <Typography variant="body2">
            Trạng thái: <strong>{status}</strong>
          </Typography>
          <Typography variant="body2">
            SBD: <strong>{code}</strong>
          </Typography>
          <Typography variant="body2">
            Họ tên: <strong>{fullname}</strong>
          </Typography>
          <Typography variant="body2">
            CCCD: <strong>{idCardNumber}</strong>
          </Typography>
          <Typography variant="body2">
            Tài khoản: <strong>{username}</strong>
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ backgroundColor: cardBg, padding: 1, borderRadius: 2, boxShadow: 2 }}>
      {header}
      <Stack>
        <Typography variant="body2">
          Trạng thái: <strong style={{ color: textColor }}>{status}</strong>
        </Typography>
        <Typography variant="body2">
          SBD: <strong>{code}</strong>
        </Typography>
        <Typography variant="body2">
          Họ tên: <strong>{fullname}</strong>
        </Typography>
        <Typography variant="body2">
          CCCD: <strong>{idCardNumber}</strong>
        </Typography>
        <Typography variant="body2">
          Tài khoản: <strong>{username}</strong>
        </Typography>
        <Typography variant="body2">
          IP: <strong>{ipAddress || '—'}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.3 }}>
          Cập nhật cuối:{' '}
          <span
            style={{
              color: lastUpdateStatus.color,
              fontWeight: 800,
              backgroundColor: lastUpdateStatus.bg,
              padding: '2px 6px',
              borderRadius: '6px'
            }}
          >
            {lastUpdateTime || 'Chưa trả lời'}
          </span>
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'right', mt: 0.5 }}>
          <Stack direction="row" spacing={0.5}>
            {status !== 'CHỜ THI' && (
              <Button variant="contained" size="small" sx={{ backgroundColor: '#0aa1a1' }} onClick={() => onDetail(examinee)}>
                Xem
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              disabled={readOnly}
              sx={{ backgroundColor: '#104874' }}
              onClick={() => onRestore(examinee)}
            >
              Phục hồi
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={readOnly}
              sx={{ backgroundColor: '#d1373f' }}
              onClick={() => onAddTime(examinee)}
            >
              Bù giờ
            </Button>
            {/* TẠM ẨN: "Phục hồi từ nhật ký" và "Reset kết quả" đang chạy chưa đúng — ẩn khỏi giao
                diện cho tới khi sửa xong, giữ nguyên props/dialog/handler bên dưới để bật lại nhanh. */}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

ExamineeCard.propTypes = {
  examinee: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  selected: PropTypes.bool,
  onToggleSelect: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onAddTime: PropTypes.func.isRequired
};

export default ExamineeCard;
