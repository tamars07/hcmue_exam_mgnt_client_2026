import { useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Checkbox,
  Chip,
  IconButton,
  MenuItem,
  Stack,
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
import {
  ClockCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import AddTimeDialog from './AddTimeDialog';
import RestoreDialog from './RestoreDialog';
import ExamineeDetailDialog from './ExamineeDetailDialog';
import RestoreFromLogDialog from './RestoreFromLogDialog';
import ResetResultDialog from './ResetResultDialog';

const STATUS_COLOR = {
  'CHƯA ĐĂNG NHẬP': 'default',
  'CHỜ THI': 'info',
  'ĐANG THI': 'warning',
  'ĐÃ NỘP BÀI': 'success'
};

// ==============================|| ĐIỂM TRƯỞNG - THÍ SINH ||============================== //

const ChairmanExamineesPage = () => {
  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCode, setTurnCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');

  const [examinees, setExaminees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  const [addTimeTarget, setAddTimeTarget] = useState(null); // { accounts: [] }
  const [restoreTarget, setRestoreTarget] = useState(null); // { accounts: [] }
  const [detailAccount, setDetailAccount] = useState(null);
  const [restoreFromLogAccount, setRestoreFromLogAccount] = useState(null);
  const [resetTarget, setResetTarget] = useState(null); // examinee row

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        const list = res.data.data;
        setCouncils(list);
        if (list.length > 0) setCouncilCode(list[0].code);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!councilCode) return;
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
    setTurnCode('');
    setRoomCode('');
  }, [councilCode]);

  useEffect(() => {
    if (!turnCode) {
      setRooms([]);
      return;
    }
    chairmanService
      .getCouncilTurnRooms(turnCode)
      .then((res) => setRooms(res.data.data))
      .catch(() => setRooms([]));
    setRoomCode('');
  }, [turnCode]);

  const fetchExaminees = () => {
    if (!turnCode || !roomCode) {
      setExaminees([]);
      return;
    }
    setLoading(true);
    chairmanService
      .getExamineesByRoom(turnCode, roomCode)
      .then((res) => setExaminees(res.data.data.examinees))
      .catch((e) => openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách thí sinh', variant: 'alert', alert: { color: 'error' } }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelected([]);
    fetchExaminees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnCode, roomCode]);

  const toggleSelect = (username, checked) => {
    setSelected((prev) => (checked ? [...prev, username] : prev.filter((u) => u !== username)));
  };

  const allSelected = examinees.length > 0 && selected.length === examinees.length;
  const someSelected = selected.length > 0 && !allSelected;

  const handleAfterAction = () => {
    setSelected([]);
    fetchExaminees();
  };

  return (
    <MainCard title="Thí sinh">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          {councils.length > 1 && (
            <TextField select size="small" label="Hội đồng thi" value={councilCode} onChange={(e) => setCouncilCode(e.target.value)} sx={{ minWidth: 240 }}>
              {councils.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.desc || c.code}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField select size="small" label="Ca thi" value={turnCode} onChange={(e) => setTurnCode(e.target.value)} sx={{ minWidth: 200 }}>
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Phòng thi"
            value={roomCode}
            disabled={!turnCode}
            onChange={(e) => setRoomCode(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {rooms.map((r) => (
              <MenuItem key={r.room_code} value={r.room_code}>
                {r.room_code}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {!roomCode ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Chọn ca thi và phòng thi để xem danh sách thí sinh.
          </Typography>
        ) : (
          <>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ClockCircleOutlined />}
                disabled={selected.length === 0}
                onClick={() => setAddTimeTarget({ accounts: selected })}
              >
                Bù giờ ({selected.length})
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReloadOutlined />}
                disabled={selected.length === 0}
                onClick={() => setRestoreTarget({ accounts: selected })}
              >
                Phục hồi ({selected.length})
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) => setSelected(e.target.checked ? examinees.map((ex) => ex.username) : [])}
                      />
                    </TableCell>
                    <TableCell>Vị trí</TableCell>
                    <TableCell>CCCD/MSSV</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Môn thi</TableCell>
                    <TableCell>Tiến độ</TableCell>
                    <TableCell>Cập nhật lúc</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examinees.map((ex) => (
                    <TableRow key={ex.username}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.includes(ex.username)} onChange={(e) => toggleSelect(ex.username, e.target.checked)} />
                      </TableCell>
                      <TableCell>{ex.seat_number}</TableCell>
                      <TableCell>{ex.id_card_number}</TableCell>
                      <TableCell>
                        {ex.fullname}
                        {ex.is_backup ? <Chip label="Dự phòng" size="small" color="warning" sx={{ ml: 1 }} /> : null}
                      </TableCell>
                      <TableCell>{ex.subject}</TableCell>
                      <TableCell>
                        {ex.answered_count}/{ex.total_questions}
                      </TableCell>
                      <TableCell>{ex.last_update_time || '—'}</TableCell>
                      <TableCell>
                        <Chip label={ex.status} size="small" color={STATUS_COLOR[ex.status] || 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Xem chi tiết bài làm">
                          <IconButton size="small" onClick={() => setDetailAccount(ex.username)}>
                            <EyeOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Bù giờ">
                          <IconButton size="small" onClick={() => setAddTimeTarget({ accounts: [ex.username] })}>
                            <ClockCircleOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Phục hồi trạng thái">
                          <IconButton size="small" onClick={() => setRestoreTarget({ accounts: [ex.username] })}>
                            <ReloadOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Phục hồi từ nhật ký">
                          <IconButton size="small" onClick={() => setRestoreFromLogAccount(ex.username)}>
                            <HistoryOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset kết quả">
                          <IconButton size="small" color="error" onClick={() => setResetTarget(ex)}>
                            <WarningOutlined />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && examinees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography color="text.secondary" align="center">
                          Phòng thi này chưa có thí sinh.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>

      {addTimeTarget && (
        <AddTimeDialog
          open
          onClose={() => setAddTimeTarget(null)}
          turnCode={turnCode}
          roomCode={roomCode}
          accounts={addTimeTarget.accounts}
          onDone={handleAfterAction}
        />
      )}
      {restoreTarget && (
        <RestoreDialog
          open
          onClose={() => setRestoreTarget(null)}
          turnCode={turnCode}
          roomCode={roomCode}
          accounts={restoreTarget.accounts}
          onDone={handleAfterAction}
        />
      )}
      <ExamineeDetailDialog open={!!detailAccount} onClose={() => setDetailAccount(null)} account={detailAccount} />
      <RestoreFromLogDialog
        open={!!restoreFromLogAccount}
        onClose={() => setRestoreFromLogAccount(null)}
        account={restoreFromLogAccount}
        onDone={handleAfterAction}
      />
      <ResetResultDialog open={!!resetTarget} onClose={() => setResetTarget(null)} examinee={resetTarget} onDone={handleAfterAction} />
    </MainCard>
  );
};

export default ChairmanExamineesPage;
