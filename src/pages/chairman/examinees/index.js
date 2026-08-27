import { useEffect, useRef, useState } from 'react';

// material-ui
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { SyncOutlined, DatabaseOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import RoomMonitorSection from './RoomMonitorSection';
import AddTimeDialog from './AddTimeDialog';
import RestoreDialog from './RestoreDialog';
import ExamineeDetailDialog from './ExamineeDetailDialog';
import ExamineeLogsDialog from './ExamineeLogsDialog';
import RestoreFromLogDialog from './RestoreFromLogDialog';
import ResetResultDialog from './ResetResultDialog';
import TurnDataManagementDialog from './TurnDataManagementDialog';
import { isCouncilRunningToday, formatTurnLabel, isTurnToday } from 'utils/council-schedule';

const AUTO_SYNC_INTERVAL_OPTIONS = [10, 30, 60, 120, 300];
const ACTIVATED_ROOMS_VALUE = '__ACTIVATED_ROOMS__';

// ==============================|| GIÁM SÁT KÌ THI ||============================== //

const ChairmanExamineesPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCode, setTurnCode] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomCodes, setSelectedRoomCodes] = useState([]);

  const [roomsData, setRoomsData] = useState([]);

  const [fetching, setFetching] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState(60);

  const [addTimeRoom, setAddTimeRoom] = useState(null); // room object (Bù giờ đồng loạt)
  const [restoreRoom, setRestoreRoom] = useState(null); // room object (Phục hồi đồng loạt)
  const [detailAccount, setDetailAccount] = useState(null);
  const [logsAccount, setLogsAccount] = useState(null);
  const [restoreFromLogAccount, setRestoreFromLogAccount] = useState(null);
  const [resetTarget, setResetTarget] = useState(null); // examinee row
  const [dataManagementOpen, setDataManagementOpen] = useState(false);

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        // Chỉ liệt kê hội đồng thi đang diễn ra trong ngày hôm nay — 1 điểm trưởng có thể được gán
        // nhiều hội đồng thi khác ngày, không cần hiện hết ở đây.
        const todayCouncils = (res.data.data || []).filter(isCouncilRunningToday);
        setCouncils(todayCouncils);
        if (todayCouncils.length === 1) setCouncilCode(todayCouncils[0].code);
      })
      .catch(() => openSnackbar({ open: true, message: 'Không tải được hội đồng thi', variant: 'alert', alert: { color: 'error' } }));
  }, []);

  useEffect(() => {
    setTurnCode('');
    setAvailableRooms([]);
    setSelectedRoomCodes([]);
    setRoomsData([]);
    if (!councilCode) {
      setTurns([]);
      return;
    }
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [councilCode]);

  useEffect(() => {
    setSelectedRoomCodes([]);
    setRoomsData([]);
    if (!turnCode) {
      setAvailableRooms([]);
      return;
    }
    chairmanService
      .getCouncilTurnRooms(turnCode)
      .then((res) =>
        setAvailableRooms([...res.data.data].sort((a, b) => (a.room_name || '').localeCompare(b.room_name || '', 'vi', { numeric: true })))
      )
      .catch(() => setAvailableRooms([]));
  }, [turnCode]);

  const fetchMonitorData = async (roomCodes, { silent = false } = {}) => {
    if (!turnCode || roomCodes.length === 0) return;
    const doFetch = async () => {
      const res = await chairmanService.getRoomsMonitor(turnCode, roomCodes);
      setRoomsData(res.data.data);
      setLastSyncTime(
        new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };

    if (silent) {
      setAutoSyncing(true);
      try {
        await doFetch();
      } catch (e) {
        // im lặng bỏ qua lỗi đồng bộ tự động, tránh làm phiền người dùng liên tục
      } finally {
        setAutoSyncing(false);
      }
      return;
    }

    setFetching(true);
    try {
      await withLoading(doFetch, 'Đang tải dữ liệu giám sát...');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được dữ liệu giám sát', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setFetching(false);
    }
  };

  const handleFetchClick = () => {
    fetchMonitorData(selectedRoomCodes);
  };

  const handleSyncClick = () => fetchMonitorData(selectedRoomCodes);

  const stateRef = useRef({});
  stateRef.current = { fetching, autoSyncing, roomsData, selectedRoomCodes, turnCode };

  useEffect(() => {
    if (!autoSyncEnabled || !autoSyncInterval || autoSyncInterval < 5) return undefined;

    const timer = setInterval(() => {
      const {
        fetching: isFetching,
        autoSyncing: isAutoSyncing,
        roomsData: currentRoomsData,
        selectedRoomCodes: currentRoomCodes
      } = stateRef.current;
      if (!isFetching && !isAutoSyncing && currentRoomsData.length > 0 && currentRoomCodes.length > 0) {
        fetchMonitorData(currentRoomCodes, { silent: true });
      }
    }, autoSyncInterval * 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSyncEnabled, autoSyncInterval]);

  const refreshAfterAction = () => {
    fetchMonitorData(selectedRoomCodes, { silent: true });
  };

  const selectedTurn = turns.find((t) => t.code === turnCode);
  const turnIsToday = isTurnToday(selectedTurn);
  const activatedRoomCodes = availableRooms.filter((r) => r.is_active).map((r) => r.room_code);

  return (
    <MainCard title="Giám sát ca thi">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="flex-start">
            <TextField
              select
              size="small"
              label="Hội đồng thi"
              value={councilCode}
              onChange={(e) => setCouncilCode(e.target.value)}
              sx={{ minWidth: 240 }}
              helperText={councils.length === 0 ? 'Không có hội đồng thi nào diễn ra hôm nay' : ''}
            >
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
              value={turnCode}
              disabled={!councilCode}
              onChange={(e) => setTurnCode(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {turns.map((t) => (
                <MenuItem key={t.code} value={t.code}>
                  {formatTurnLabel(t)}
                </MenuItem>
              ))}
            </TextField>
            <FormControl size="small" disabled={!turnCode} sx={{ minWidth: 260 }}>
              <InputLabel id="rooms-label">Phòng thi</InputLabel>
              <Select
                labelId="rooms-label"
                multiple
                value={selectedRoomCodes}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                  if (value.includes(ACTIVATED_ROOMS_VALUE)) {
                    const allActivatedSelected =
                      activatedRoomCodes.length > 0 &&
                      selectedRoomCodes.length === activatedRoomCodes.length &&
                      activatedRoomCodes.every((c) => selectedRoomCodes.includes(c));
                    setSelectedRoomCodes(allActivatedSelected ? [] : activatedRoomCodes);
                    return;
                  }
                  setSelectedRoomCodes(value);
                }}
                input={<OutlinedInput label="Phòng thi" />}
                renderValue={(selected) =>
                  selected.length === 0
                    ? 'Chọn phòng thi'
                    : activatedRoomCodes.length > 0 &&
                        selected.length === activatedRoomCodes.length &&
                        activatedRoomCodes.every((c) => selected.includes(c))
                      ? 'Phòng đã kích hoạt'
                      : availableRooms
                          .filter((r) => selected.includes(r.room_code))
                          .map((r) => r.room_name)
                          .join(', ')
                }
              >
                <MenuItem value={ACTIVATED_ROOMS_VALUE} disabled={activatedRoomCodes.length === 0}>
                  <Checkbox
                    checked={
                      activatedRoomCodes.length > 0 &&
                      selectedRoomCodes.length === activatedRoomCodes.length &&
                      activatedRoomCodes.every((c) => selectedRoomCodes.includes(c))
                    }
                    indeterminate={
                      activatedRoomCodes.length > 0 &&
                      selectedRoomCodes.some((c) => activatedRoomCodes.includes(c)) &&
                      !(
                        selectedRoomCodes.length === activatedRoomCodes.length &&
                        activatedRoomCodes.every((c) => selectedRoomCodes.includes(c))
                      )
                    }
                    size="small"
                  />
                  <ListItemText primary="Phòng đã kích hoạt" />
                </MenuItem>
                <Divider />
                {availableRooms.map((r) => (
                  <MenuItem key={r.room_code} value={r.room_code}>
                    <Checkbox checked={selectedRoomCodes.includes(r.room_code)} size="small" />
                    <ListItemText primary={r.room_name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="success"
              disabled={!turnCode || selectedRoomCodes.length === 0 || fetching}
              onClick={handleFetchClick}
            >
              Lấy dữ liệu
            </Button>
            <Button variant="outlined" color="warning" disabled={selectedRoomCodes.length === 0} onClick={() => setSelectedRoomCodes([])}>
              Chọn lại
            </Button>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DatabaseOutlined />}
            disabled={!turnCode}
            onClick={() => setDataManagementOpen(true)}
          >
            Quản lý dữ liệu
          </Button>
        </Stack>

        {roomsData.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Chọn hội đồng thi, ca thi và ít nhất 1 phòng thi rồi bấm &quot;Lấy dữ liệu&quot; để bắt đầu giám sát.
          </Typography>
        ) : (
          <>
            {!turnIsToday && (
              <Alert severity="info">
                Ca thi này không diễn ra hôm nay — chỉ có thể xem thông tin, không thể bù giờ/phục hồi/reset kết quả.
              </Alert>
            )}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1}>
              <Button variant="contained" color="success" startIcon={<SyncOutlined />} disabled={fetching} onClick={handleSyncClick}>
                Đồng bộ
              </Button>
              <FormControlLabel
                control={<Switch checked={autoSyncEnabled} onChange={(e) => setAutoSyncEnabled(e.target.checked)} />}
                label="Tự động đồng bộ"
              />
              <TextField
                select
                size="small"
                label="Chu kỳ"
                value={autoSyncInterval}
                disabled={!autoSyncEnabled}
                onChange={(e) => setAutoSyncInterval(e.target.value)}
                sx={{ width: 140 }}
              >
                {AUTO_SYNC_INTERVAL_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s} giây
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28 }}>
                {autoSyncing && (
                  <>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Đang tự động đồng bộ...
                    </Typography>
                  </>
                )}
                {!autoSyncing && lastSyncTime && (
                  <Typography variant="body2" sx={{ color: '#1B5E20', fontWeight: 500 }}>
                    Đồng bộ lần cuối: {lastSyncTime}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack spacing={3}>
              {roomsData.map((room) => (
                <RoomMonitorSection
                  key={room.room_code}
                  room={room}
                  readOnly={!turnIsToday}
                  onDetail={(examinee) => setDetailAccount(examinee)}
                  onViewLogs={(examinee) => setLogsAccount(examinee)}
                  onRestoreFromLog={(username) => setRestoreFromLogAccount(username)}
                  onReset={(examinee) => setResetTarget(examinee)}
                  onOpenRestore={() => setRestoreRoom(room)}
                  onOpenAddTime={() => setAddTimeRoom(room)}
                />
              ))}
            </Stack>
          </>
        )}
      </Stack>

      {addTimeRoom && (
        <AddTimeDialog
          open
          onClose={() => setAddTimeRoom(null)}
          turnCode={turnCode}
          roomCode={addTimeRoom.room_code}
          examinees={addTimeRoom.examinees || []}
          onDone={refreshAfterAction}
        />
      )}
      {restoreRoom && (
        <RestoreDialog
          open
          onClose={() => setRestoreRoom(null)}
          turnCode={turnCode}
          roomCode={restoreRoom.room_code}
          examinees={restoreRoom.examinees || []}
          onDone={refreshAfterAction}
        />
      )}
      <ExamineeDetailDialog
        open={!!detailAccount}
        onClose={() => setDetailAccount(null)}
        account={detailAccount?.username}
        fullname={detailAccount?.fullname}
      />
      <ExamineeLogsDialog
        open={!!logsAccount}
        onClose={() => setLogsAccount(null)}
        account={logsAccount?.username}
        fullname={logsAccount?.fullname}
      />
      <RestoreFromLogDialog
        open={!!restoreFromLogAccount}
        onClose={() => setRestoreFromLogAccount(null)}
        account={restoreFromLogAccount}
        onDone={refreshAfterAction}
      />
      <ResetResultDialog open={!!resetTarget} onClose={() => setResetTarget(null)} examinee={resetTarget} onDone={refreshAfterAction} />
      <TurnDataManagementDialog
        open={dataManagementOpen}
        onClose={() => setDataManagementOpen(false)}
        turnCode={turnCode}
        onChanged={refreshAfterAction}
      />
    </MainCard>
  );
};

export default ChairmanExamineesPage;
