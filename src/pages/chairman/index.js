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
  Typography
} from '@mui/material';
import { CheckCircleOutlined, DownOutlined, PoweroffOutlined, ThunderboltOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { isCouncilRunningToday, formatTurnLabel, isTurnToday } from 'utils/council-schedule';

// ==============================|| ĐIỂM TRƯỞNG - KÍCH HOẠT PHÒNG THI ||============================== //

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

  const [expandedTurnCode, setExpandedTurnCode] = useState(false);
  const [roomsByTurn, setRoomsByTurn] = useState({});
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // { open, action: 'activate' | 'deactivate', scope: { type: 'bulk' } | { type: 'single', room } }
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

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

  useEffect(() => {
    setTurns([]);
    setRoomsByTurn({});
    setExpandedTurnCode(false);
    setSelectedRoomIds([]);
    if (!councilCode) return;
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [councilCode]);

  const fetchTurnRooms = async (turnCode) => {
    setLoadingTurn(true);
    try {
      const res = await chairmanService.getCouncilTurnDetails(turnCode);
      const sorted = [...res.data.data].sort((a, b) =>
        (a.room?.name || '').localeCompare(b.room?.name || '', 'vi', { numeric: true })
      );
      setRoomsByTurn((prev) => ({ ...prev, [turnCode]: sorted }));
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách phòng thi', variant: 'alert', alert: { color: 'error' } });
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
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <MainCard title="Kích hoạt phòng thi">
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

          return (
            <Accordion key={turn.code} expanded={expandedTurnCode === turn.code} onChange={handleAccordionChange(turn.code)}>
              <AccordionSummary expandIcon={<DownOutlined />}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', flexWrap: 'wrap', rowGap: 0.5 }}>
                  <Typography sx={{ fontWeight: 500, minWidth: 160 }}>
                    {turn.code} - {formatTurnLabel(turn)}
                  </Typography>
                  <Chip label={`${turn.no_rooms} phòng`} size="small" />
                  {!turnIsToday && <Chip label="Chỉ xem — không phải ca thi hôm nay" size="small" color="default" />}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {loadingTurn && expandedTurnCode === turn.code ? (
                  <Typography color="text.secondary">Đang tải...</Typography>
                ) : rooms.length === 0 ? (
                  <Typography color="text.secondary">Ca thi này chưa gán phòng thi nào.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            disabled={!turnIsToday}
                            onChange={(e) =>
                              setSelectedRoomIds(e.target.checked ? rooms.map((r) => r.council_turn_room_id) : [])
                            }
                          />
                        }
                        label="Chọn tất cả"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ThunderboltOutlined />}
                        disabled={!turnIsToday || selectedRoomIds.length === 0}
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
                            <Chip label="Đang kích hoạt" color="success" size="small" icon={<CheckCircleOutlined />} />
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
                                disabled={!turnIsToday}
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
        <DialogTitle>
          Xác nhận {confirmDialog?.action === 'activate' ? 'kích hoạt' : 'huỷ kích hoạt'} phòng thi
        </DialogTitle>
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
    </MainCard>
  );
};

export default ChairmanRoomsPage;
