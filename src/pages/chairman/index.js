import { useEffect, useState } from 'react';

// material-ui
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  PauseCircleOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  StopOutlined,
  ThunderboltOutlined,
  UndoOutlined
} from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { isCouncilRunningToday, formatTurnLabel, isTurnToday, getTurnDataStatus } from 'utils/council-schedule';

// ==============================|| ĐIỂM TRƯỞNG - QUẢN LÝ CA THI ||============================== //

const TURN_STATUS_ICONS = {
  pending: <ClockCircleOutlined />,
  not_exam_yet: <PauseCircleOutlined />,
  running: <CheckCircleOutlined />,
  ended: <StopOutlined />
};

const LIFECYCLE_TITLES = {
  start: 'Xác nhận Bắt đầu ca thi',
  cancel_start: 'Xác nhận Huỷ bắt đầu ca thi',
  end: 'Xác nhận Kết thúc ca thi',
  resume: 'Xác nhận Mở lại ca thi'
};

const LIFECYCLE_LOADING_MESSAGES = {
  start: 'Đang bắt đầu ca thi... Vui lòng chờ',
  cancel_start: 'Đang huỷ trạng thái bắt đầu... Vui lòng chờ',
  end: 'Đang kết thúc ca thi... Vui lòng chờ',
  resume: 'Đang mở lại ca thi... Vui lòng chờ'
};

const LIFECYCLE_SUCCESS_MESSAGES = {
  start: 'Đã bắt đầu ca thi',
  cancel_start: 'Đã huỷ trạng thái bắt đầu ca thi',
  end: 'Đã kết thúc ca thi',
  resume: 'Đã mở lại ca thi'
};

const LIFECYCLE_ACTION_FNS = {
  start: (turnCode, message, enforceDayOrder) => chairmanService.startTurnData(turnCode, message, enforceDayOrder),
  cancel_start: (turnCode, message) => chairmanService.cancelStartTurnData(turnCode, message),
  end: (turnCode, message) => chairmanService.endTurnData(turnCode, message),
  resume: (turnCode, message) => chairmanService.resumeTurnData(turnCode, message)
};

// Đảm bảo hiệu ứng chờ hiện tối thiểu 3 giây sau khi bấm Kích hoạt/Huỷ kích hoạt, kể cả khi API
// phản hồi nhanh hơn — tránh cảm giác thao tác "chưa chắc đã chạy" với 1 hành động quan trọng.
const MIN_ACTIVATION_LOADING_MS = 3000;

const withMinDuration = async (task, minMs) => {
  const start = Date.now();
  try {
    return await task();
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < minMs) {
      await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
    }
  }
};

const ChairmanRoomsPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnStatusByCode, setTurnStatusByCode] = useState({});
  // Ràng buộc các ca thi trong cùng 1 ngày phải được bắt đầu theo đúng thứ tự trước-sau — mặc định
  // bật, điểm trưởng tự tắt khi có nhu cầu bắt đầu 1 ca bất kỳ trong ngày (vd ca thi đột xuất).
  const [enforceDayOrder, setEnforceDayOrder] = useState(true);

  const [expandedTurnCode, setExpandedTurnCode] = useState(false);
  const [roomsByTurn, setRoomsByTurn] = useState({});
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // { open, action: 'activate' | 'deactivate', scope: { type: 'bulk' } | { type: 'single', room } }
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // { turnCode, action: 'start' | 'end' | 'resume' }
  const [lifecycleDialog, setLifecycleDialog] = useState(null);
  const [lifecycleMessage, setLifecycleMessage] = useState('');
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        // Điểm trưởng: chỉ hội đồng thi được phân công và đang diễn ra hôm nay (getMyCouncils() đã
        // lọc theo phân công ở backend, chỉ cần lọc thêm theo ngày ở đây). Admin: getMyCouncils()
        // trả về mọi hội đồng thi, chỉ cần lọc theo ngày hôm nay.
        const list = (res.data.data || []).filter(isCouncilRunningToday);
        setCouncils(list);
        if (list.length === 1) setCouncilCode(list[0].code);
      })
      .catch(() => openSnackbar({ open: true, message: 'Không tải được hội đồng thi', variant: 'alert', alert: { color: 'error' } }));
  }, []);

  // Trạng thái đầy đủ (can_start/can_resume/is_backup/is_cleaned) của từng ca thi — cần gọi riêng vì
  // getCouncilTurns() chỉ trả về started_at/ended_at thô, không tính được xung đột với ca thi khác.
  const fetchTurnStatuses = async (turnList) => {
    const entries = await Promise.all(
      turnList.map((t) =>
        chairmanService
          .getTurnDataStatus(t.code)
          .then((res) => [t.code, res.data.data])
          .catch(() => [t.code, null])
      )
    );
    setTurnStatusByCode(Object.fromEntries(entries));
  };

  const refreshTurns = async () => {
    if (!councilCode) return;
    try {
      const res = await chairmanService.getCouncilTurns(councilCode);
      setTurns(res.data.data);
      fetchTurnStatuses(res.data.data);
    } catch (e) {
      // giữ nguyên danh sách cũ nếu tải lại lỗi, không cần báo ồn ào cho 1 lần refresh nền
    }
  };

  useEffect(() => {
    setTurns([]);
    setTurnStatusByCode({});
    setRoomsByTurn({});
    setExpandedTurnCode(false);
    setSelectedRoomIds([]);
    if (!councilCode) return;
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => {
        setTurns(res.data.data);
        fetchTurnStatuses(res.data.data);
      })
      .catch(() => setTurns([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [councilCode]);

  const fetchTurnRooms = async (turnCode) => {
    setLoadingTurn(true);
    try {
      const res = await chairmanService.getCouncilTurnDetails(turnCode);
      const sorted = [...res.data.data].sort((a, b) => (a.room?.name || '').localeCompare(b.room?.name || '', 'vi', { numeric: true }));
      setRoomsByTurn((prev) => ({ ...prev, [turnCode]: sorted }));
    } catch (e) {
      openSnackbar({
        open: true,
        message: e?.message || 'Không tải được danh sách phòng thi',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleAccordionChange = (turnCode) => (event, isExpanded) => {
    setExpandedTurnCode(isExpanded ? turnCode : false);
    setSelectedRoomIds([]);
    if (isExpanded && !roomsByTurn[turnCode]) {
      fetchTurnRooms(turnCode);
    }
  };

  const toggleRoomSelection = (id, checked) => {
    setSelectedRoomIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const openConfirm = (action, scope) => {
    setConfirmMessage('');
    setConfirmDialog({ action, scope });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;
    const { action, scope } = confirmDialog;
    const isActivate = action === 'activate';

    try {
      await withLoading(
        () =>
          withMinDuration(async () => {
            if (scope.type === 'single') {
              await (isActivate
                ? chairmanService.activateRoom(scope.room.council_turn_room_id, confirmMessage)
                : chairmanService.deactivateRoom(scope.room.council_turn_room_id, confirmMessage));
            } else {
              await (isActivate
                ? chairmanService.activateRoomsBulk(selectedRoomIds, confirmMessage)
                : chairmanService.deactivateRoomsBulk(selectedRoomIds, confirmMessage));
            }
          }, MIN_ACTIVATION_LOADING_MS),
        isActivate ? 'Đang kích hoạt phòng thi... Vui lòng chờ' : 'Đang huỷ kích hoạt phòng thi... Vui lòng chờ'
      );

      openSnackbar({
        open: true,
        message: isActivate ? 'Đã kích hoạt phòng thi' : 'Đã huỷ kích hoạt phòng thi',
        variant: 'alert',
        alert: { color: 'success' }
      });
      setConfirmDialog(null);
      setSelectedRoomIds([]);
      if (expandedTurnCode) fetchTurnRooms(expandedTurnCode);
      // Kích hoạt/huỷ kích hoạt phòng có thể đổi trạng thái hiển thị "Chưa thi"/"Đang thi" của ca
      // thi (has_active_room) — nạp lại danh sách ca thi để Chip trạng thái cập nhật ngay.
      refreshTurns();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const openLifecycle = (turnCode, action) => {
    setLifecycleMessage('');
    setLifecycleDialog({ turnCode, action });
  };

  const confirmLifecycle = async () => {
    if (!lifecycleDialog) return;
    const { turnCode, action } = lifecycleDialog;

    setLifecycleBusy(true);
    try {
      await withLoading(
        () => LIFECYCLE_ACTION_FNS[action](turnCode, lifecycleMessage, enforceDayOrder),
        LIFECYCLE_LOADING_MESSAGES[action]
      );
      openSnackbar({ open: true, message: LIFECYCLE_SUCCESS_MESSAGES[action], variant: 'alert', alert: { color: 'success' } });
      setLifecycleDialog(null);
      refreshTurns();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLifecycleBusy(false);
    }
  };

  return (
    <MainCard title="Quản lý ca thi">
      <Stack spacing={2}>
        <TextField
          select
          size="small"
          label="Hội đồng thi"
          value={councilCode}
          onChange={(e) => setCouncilCode(e.target.value)}
          sx={{ maxWidth: 360 }}
          helperText={councils.length === 0 ? 'Không có hội đồng thi nào diễn ra hôm nay' : ''}
        >
          {councils.map((c) => (
            <MenuItem key={c.code} value={c.code}>
              {c.desc || c.code}
            </MenuItem>
          ))}
        </TextField>

        {councilCode && turns.length > 1 && (
          <FormControlLabel
            sx={{ ml: 0 }}
            control={<Checkbox checked={enforceDayOrder} onChange={(e) => setEnforceDayOrder(e.target.checked)} />}
            label="Bắt đầu theo thứ tự trong ngày"
          />
        )}

        {!councilCode && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            Chọn hội đồng thi để xem danh sách ca thi và phòng thi.
          </Typography>
        )}

        {councilCode && turns.length === 0 && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            Hội đồng thi này chưa có ca thi nào.
          </Typography>
        )}

        {turns.map((turn) => {
          const rooms = roomsByTurn[turn.code] || [];
          const allSelected = rooms.length > 0 && selectedRoomIds.length === rooms.length;
          const someSelected = selectedRoomIds.length > 0 && !allSelected;
          const turnIsToday = isTurnToday(turn);
          const dataStatus = getTurnDataStatus(turn);
          const lifecycle = turnStatusByCode[turn.code];
          // Cố ý không dựa vào dataStatus.key === 'running' ở đây — trạng thái đó chỉ đúng SAU KHI
          // đã có ít nhất 1 phòng được kích hoạt, dùng nó để khoá nút kích hoạt sẽ khiến không thể
          // kích hoạt phòng ĐẦU TIÊN của ca thi. Ràng buộc thật sự chỉ cần ca thi đã bắt đầu.
          const canActivateRoom = !!turn.started_at && !turn.ended_at;

          // Day-order (blocking_earlier_turn_today) không được server tính vào can_start vì nó phụ
          // thuộc checkbox "Bắt đầu theo thứ tự trong ngày" ở giao diện, không phải 1 sự thật cố định
          // — chỉ enforce ở đây khi checkbox đang bật.
          const dayOrderBlocked = enforceDayOrder && !!lifecycle?.blocking_earlier_turn_today;
          const startTooltip = dayOrderBlocked
            ? `Cần bắt đầu ca thi "${lifecycle.blocking_earlier_turn_today}" trước (diễn ra sớm hơn trong ngày hôm nay) — tắt "Bắt đầu theo thứ tự trong ngày" nếu muốn bắt đầu ca này trước`
            : !lifecycle || lifecycle.can_start
              ? ''
              : !lifecycle.is_turn_today
                ? 'Ca thi này không diễn ra hôm nay, không thể bắt đầu'
                : !lifecycle.start_window_open
                  ? `Chưa đến thời điểm được phép bắt đầu ca thi — mở lúc ${lifecycle.start_window_at}`
                  : lifecycle.blocking_started_turn
                    ? `Ca thi "${lifecycle.blocking_started_turn}" đang được bắt đầu — cần kết thúc và dọn dẹp dữ liệu trước`
                    : lifecycle.blocking_uncleaned_turn
                      ? `Ca thi "${lifecycle.blocking_uncleaned_turn}" đã kết thúc nhưng chưa dọn dẹp dữ liệu — cần dọn dẹp trước`
                      : '';
          const resumeTooltip =
            !lifecycle || lifecycle.can_resume
              ? ''
              : lifecycle.is_cleaned
                ? 'Dữ liệu ca thi này đã được dọn dẹp, không thể mở lại'
                : lifecycle.blocking_started_turn
                  ? `Ca thi "${lifecycle.blocking_started_turn}" đang được bắt đầu — cần kết thúc và dọn dẹp dữ liệu trước`
                  : lifecycle.blocking_uncleaned_turn
                    ? `Ca thi "${lifecycle.blocking_uncleaned_turn}" đã kết thúc nhưng chưa dọn dẹp dữ liệu — cần dọn dẹp trước`
                    : '';
          const cancelStartTooltip =
            !lifecycle || lifecycle.can_cancel_start ? '' : 'Ca thi này đã nhận đề thi, không thể huỷ trạng thái bắt đầu';

          return (
            <Accordion key={turn.code} expanded={expandedTurnCode === turn.code} onChange={handleAccordionChange(turn.code)}>
              <AccordionSummary expandIcon={<DownOutlined />}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: '100%', flexWrap: 'wrap', rowGap: 1 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={0.5}>
                    <Typography sx={{ fontWeight: 500, minWidth: 160 }}>
                      {turn.code} - {formatTurnLabel(turn)}
                    </Typography>
                    <Chip label={`${turn.no_rooms} phòng`} size="small" />
                    <Chip label={dataStatus.label} color={dataStatus.color} size="small" icon={TURN_STATUS_ICONS[dataStatus.key]} />
                    {!turnIsToday && <Chip label="Chỉ xem — không phải ca thi hôm nay" size="small" color="default" />}
                  </Stack>

                  <Stack direction="row" spacing={0.5}>
                    {dataStatus.key === 'pending' && (
                      <Tooltip title={startTooltip}>
                        <span>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CaretRightOutlined />}
                            disabled={!lifecycle || !lifecycle.can_start || dayOrderBlocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLifecycle(turn.code, 'start');
                            }}
                          >
                            Bắt đầu
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {dataStatus.key === 'not_exam_yet' && (
                      <Tooltip title={cancelStartTooltip}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<UndoOutlined />}
                            disabled={!lifecycle || !lifecycle.can_cancel_start}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLifecycle(turn.code, 'cancel_start');
                            }}
                          >
                            Huỷ bắt đầu
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {(dataStatus.key === 'running' || dataStatus.key === 'not_exam_yet') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<StopOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openLifecycle(turn.code, 'end');
                        }}
                      >
                        Kết thúc
                      </Button>
                    )}
                    {dataStatus.key === 'ended' && lifecycle && !lifecycle.is_cleaned && (
                      <Tooltip title={resumeTooltip}>
                        <span>
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            startIcon={<ReloadOutlined />}
                            disabled={!lifecycle.can_resume}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLifecycle(turn.code, 'resume');
                            }}
                          >
                            Mở lại
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {loadingTurn && expandedTurnCode === turn.code ? (
                  <Typography color="text.secondary">Đang tải...</Typography>
                ) : rooms.length === 0 ? (
                  <Typography color="text.secondary">Ca thi này chưa gán phòng thi nào.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {turnIsToday && !canActivateRoom && (
                      <Alert severity="info">Cần bấm &quot;Bắt đầu&quot; ca thi trước khi kích hoạt phòng thi.</Alert>
                    )}
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            disabled={!turnIsToday}
                            onChange={(e) => setSelectedRoomIds(e.target.checked ? rooms.map((r) => r.council_turn_room_id) : [])}
                          />
                        }
                        label="Chọn tất cả"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ThunderboltOutlined />}
                        disabled={!turnIsToday || !canActivateRoom || selectedRoomIds.length === 0}
                        onClick={() => openConfirm('activate', { type: 'bulk' })}
                      >
                        Kích hoạt đã chọn ({selectedRoomIds.length})
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<PoweroffOutlined />}
                        disabled={!turnIsToday || selectedRoomIds.length === 0}
                        onClick={() => openConfirm('deactivate', { type: 'bulk' })}
                      >
                        Huỷ kích hoạt đã chọn ({selectedRoomIds.length})
                      </Button>
                    </Stack>

                    {rooms.map((room) => (
                      <Box key={room.council_turn_room_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1}>
                          <Checkbox
                            size="small"
                            checked={selectedRoomIds.includes(room.council_turn_room_id)}
                            disabled={!turnIsToday}
                            onChange={(e) => toggleRoomSelection(room.council_turn_room_id, e.target.checked)}
                            sx={{ p: 0 }}
                          />
                          <Typography sx={{ fontWeight: 500, minWidth: 140 }}>
                            {room.room.code} - {room.room.name}
                          </Typography>
                          {room.is_active ? (
                            <Chip label="Đã kích hoạt" color="success" size="small" icon={<CheckCircleOutlined />} />
                          ) : (
                            <Chip label="Chưa kích hoạt" size="small" />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {room.activated_at && `Kích hoạt lúc: ${room.activated_at}`}
                            {room.activated_at && room.deactivated_at && ' — '}
                            {room.deactivated_at && `Huỷ lúc: ${room.deactivated_at}`}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                            {!room.is_active && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                disabled={!turnIsToday || !canActivateRoom}
                                onClick={() => openConfirm('activate', { type: 'single', room })}
                              >
                                Kích hoạt
                              </Button>
                            )}
                            {room.is_active && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                disabled={!turnIsToday}
                                onClick={() => openConfirm('deactivate', { type: 'single', room })}
                              >
                                Huỷ kích hoạt
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Xác nhận {confirmDialog?.action === 'activate' ? 'kích hoạt' : 'huỷ kích hoạt'} phòng thi</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity={confirmDialog?.action === 'activate' ? 'warning' : 'info'}>
              {confirmDialog?.scope?.type === 'single'
                ? `${confirmDialog.action === 'activate' ? 'Kích hoạt' : 'Huỷ kích hoạt'} phòng ${confirmDialog.scope.room?.room?.code}?`
                : `${confirmDialog?.action === 'activate' ? 'Kích hoạt' : 'Huỷ kích hoạt'} ${selectedRoomIds.length} phòng đã chọn?`}
            </Alert>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Ghi chú (không bắt buộc)"
              value={confirmMessage}
              onChange={(e) => setConfirmMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Huỷ</Button>
          <Button variant="contained" color={confirmDialog?.action === 'activate' ? 'success' : 'warning'} onClick={handleConfirm}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!lifecycleDialog} onClose={() => setLifecycleDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{lifecycleDialog ? LIFECYCLE_TITLES[lifecycleDialog.action] : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {lifecycleDialog?.action === 'start' && (
              <Alert severity="warning">
                Cho phép ca thi <strong>{lifecycleDialog.turnCode}</strong> bắt đầu. Lưu ý: Chỉ 1 ca thi được bắt đầu tại 1 thời điểm trong
                Hội đồng thi.
              </Alert>
            )}
            {lifecycleDialog?.action === 'cancel_start' && (
              <Alert severity="warning">
                Đưa ca thi <strong>{lifecycleDialog.turnCode}</strong> về lại trạng thái &quot;Chưa bắt đầu&quot;, như thể chưa từng bấm Bắt
                đầu. Chỉ dùng khi bấm nhầm — ca thi khác sẽ được phép bắt đầu ngay sau đó nếu cần.
              </Alert>
            )}
            {lifecycleDialog?.action === 'end' && (
              <Alert severity="error">
                Sau khi kết thúc, ca thi <strong>{lifecycleDialog.turnCode}</strong> sẽ bị khoá hoàn toàn: không thể đăng nhập lại (cán bộ
                coi thi/thí sinh), không thể nhận đề hoặc tiếp tục làm bài. Thí sinh đang làm bài dở vẫn nộp bài được bình thường.
              </Alert>
            )}
            {lifecycleDialog?.action === 'resume' && (
              <Alert severity="warning">
                Mở lại ca thi <strong>{lifecycleDialog.turnCode}</strong> — cho phép đăng nhập/nhận đề/làm bài trở lại như trước khi kết
                thúc. Nếu đã Sao lưu Dữ liệu bài thi trước đó, trạng thái đó sẽ bị đặt lại: cần sao lưu lại từ đầu nếu kết thúc ca thi này
                lần nữa.
              </Alert>
            )}
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Ghi chú (không bắt buộc)"
              value={lifecycleMessage}
              onChange={(e) => setLifecycleMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLifecycleDialog(null)}>Huỷ</Button>
          <Button
            variant="contained"
            color={
              lifecycleDialog?.action === 'end'
                ? 'error'
                : lifecycleDialog?.action === 'resume'
                  ? 'info'
                  : lifecycleDialog?.action === 'cancel_start'
                    ? 'warning'
                    : 'success'
            }
            disabled={lifecycleBusy}
            onClick={confirmLifecycle}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default ChairmanRoomsPage;
