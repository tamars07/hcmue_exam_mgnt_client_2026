import { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

// material-ui
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  Stack,
  Switch,
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
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  EditOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileZipOutlined,
  PauseCircleOutlined,
  StopOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { formatTurnLabel, getTurnDataStatus } from 'utils/council-schedule';

// ==============================|| COUNCIL TURNS - LIST ||============================== //

const TURN_STATUS_ICONS = {
  pending: <ClockCircleOutlined />,
  not_exam_yet: <PauseCircleOutlined />,
  running: <CheckCircleOutlined />,
  ended: <StopOutlined />
};

const examStatusColor = (status) => {
  switch (status) {
    case 'Nộp bài':
      return 'success';
    case 'Đang thi':
      return 'warning';
    case 'Chờ thi':
      return 'info';
    default:
      return 'default';
  }
};

const CouncilTurnsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const { code: councilCode } = useParams();
  const [council, setCouncil] = useState(null);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Mở rộng accordion của 1 ca thi -> nạp (lazy) thông tin phòng thi + giám thị cho ca thi đó.
  const [expandedTurnCode, setExpandedTurnCode] = useState(false);
  const [turnDetailsByCode, setTurnDetailsByCode] = useState({});
  const [turnDetailsLoading, setTurnDetailsLoading] = useState({});

  // Dialog chỉnh sửa ca thi: ngày giờ + chọn phòng thi, chỉ lưu khi nhấn Lưu.
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTurn, setEditingTurn] = useState(null);
  const [originalAssignedRooms, setOriginalAssignedRooms] = useState([]);
  const [selectedRoomCodes, setSelectedRoomCodes] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Dialog xem danh sách thí sinh của 1 phòng thi cụ thể.
  const [examineeDialog, setExamineeDialog] = useState(null);

  // Kích hoạt phòng thi (có dialog xác nhận) và xuất phiếu tài khoản (docx).
  const [activateTarget, setActivateTarget] = useState(null);
  const [activating, setActivating] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  // Chọn nhiều phòng để tải gộp phiếu tài khoản vào 1 file .zip (chỉ áp dụng cho ca thi đang mở rộng).
  const [selectedZipIds, setSelectedZipIds] = useState([]);
  const [zipping, setZipping] = useState(false);

  // Tải file Excel tài khoản cán bộ coi thi (kèm điểm trưởng) của toàn bộ 1 ca thi.
  const [monitorExportingCode, setMonitorExportingCode] = useState(null);

  const fetchTurns = useCallback(async () => {
    try {
      const res = await councilMgmtService.getCouncilTurns(councilCode);
      setTurns(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được ca thi', variant: 'alert', alert: { color: 'error' } });
    }
  }, [councilCode]);

  useEffect(() => {
    councilMgmtService
      .getCouncil(councilCode)
      .then((res) => {
        const c = res.data.data;
        setCouncil(c);
        return councilMgmtService.getLookup('rooms', { organization_code: c.organization_code });
      })
      .then((res) => setRooms(res.data.data))
      .catch(() => {});
    fetchTurns();
  }, [councilCode, fetchTurns]);

  const fetchTurnDetails = async (turnCode) => {
    setTurnDetailsLoading((prev) => ({ ...prev, [turnCode]: true }));
    try {
      const res = await councilMgmtService.getCouncilTurnDetails(turnCode);
      setTurnDetailsByCode((prev) => ({ ...prev, [turnCode]: res.data.data }));
    } catch (e) {
      openSnackbar({
        open: true,
        message: e?.message || 'Không tải được thông tin phòng thi',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setTurnDetailsLoading((prev) => ({ ...prev, [turnCode]: false }));
    }
  };

  const handleAccordionChange = (turnCode) => (event, isExpanded) => {
    setExpandedTurnCode(isExpanded ? turnCode : false);
    setSelectedZipIds([]);
    if (isExpanded && !turnDetailsByCode[turnCode]) {
      fetchTurnDetails(turnCode);
    }
  };

  const handleOpenEdit = async (turn) => {
    setEditingTurn(turn);
    setEditDialogOpen(true);
    setRoomsLoading(true);
    try {
      const res = await councilMgmtService.getCouncilTurnRooms(turn.code);
      setOriginalAssignedRooms(res.data.data);
      setSelectedRoomCodes(res.data.data.map((r) => r.room_code));
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được phòng thi', variant: 'alert', alert: { color: 'error' } });
      setOriginalAssignedRooms([]);
      setSelectedRoomCodes([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  const toggleRoomSelection = (roomCode, checked) => {
    setSelectedRoomCodes((prev) => (checked ? [...prev, roomCode] : prev.filter((c) => c !== roomCode)));
  };

  const handleSubmitEdit = async (values, { setSubmitting }) => {
    try {
      await withLoading(async () => {
        await councilMgmtService.updateCouncilTurn(editingTurn.code, values);

        const toAdd = selectedRoomCodes.filter((code) => !originalAssignedRooms.some((r) => r.room_code === code));
        const toRemove = originalAssignedRooms.filter((r) => !selectedRoomCodes.includes(r.room_code));

        await Promise.all([
          ...toAdd.map((code) => councilMgmtService.assignCouncilTurnRoom({ council_turn_code: editingTurn.code, room_code: code })),
          ...toRemove.map((r) => councilMgmtService.unassignCouncilTurnRoom(r.id))
        ]);
      }, 'Đang lưu ca thi... Vui lòng chờ');

      openSnackbar({ open: true, message: 'Lưu thành công', variant: 'alert', alert: { color: 'success' } });
      setEditDialogOpen(false);
      fetchTurns();
      // Danh sách phòng của ca thi này có thể đã đổi, nạp lại nếu đang mở rộng.
      if (expandedTurnCode === editingTurn.code) {
        fetchTurnDetails(editingTurn.code);
      }
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmActivateRoom = async () => {
    if (!activateTarget) return;
    setActivating(true);
    try {
      await withLoading(
        () => councilMgmtService.activateCouncilTurnRoom(activateTarget.council_turn_room_id),
        'Đang kích hoạt phòng thi... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Kích hoạt phòng thi thành công', variant: 'alert', alert: { color: 'success' } });
      setActivateTarget(null);
      if (expandedTurnCode) fetchTurnDetails(expandedTurnCode);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Kích hoạt phòng thi thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setActivating(false);
    }
  };

  const handleExportAccounts = async (detail) => {
    setExportingId(detail.council_turn_room_id);
    try {
      const res = await withLoading(
        () => councilMgmtService.exportCouncilTurnRoomAccounts(detail.council_turn_room_id),
        'Đang xuất phiếu tài khoản... Vui lòng chờ'
      );
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers['content-disposition'];
      const match = disposition && disposition.match(/filename=([^;]+)/);
      a.download = match ? match[1].trim().replace(/"/g, '') : `${detail.room.code}-phieu-tai-khoan.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      openSnackbar({ open: true, message: 'Xuất phiếu tài khoản thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setExportingId(null);
    }
  };

  const handleExportMonitorAccounts = async (turnCode) => {
    setMonitorExportingCode(turnCode);
    try {
      const res = await withLoading(
        () => councilMgmtService.exportCouncilTurnMonitorAccounts(turnCode),
        'Đang tải tài khoản cán bộ coi thi... Vui lòng chờ'
      );
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${turnCode}-Tai-khoan-giam-thi.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      openSnackbar({
        open: true,
        message: e?.message || 'Tải tài khoản cán bộ coi thi thất bại',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setMonitorExportingCode(null);
    }
  };

  const toggleZipSelection = (id, checked) => {
    setSelectedZipIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const handleDownloadZip = async (turnCode) => {
    setZipping(true);
    try {
      const res = await withLoading(
        () => councilMgmtService.exportCouncilTurnRoomAccountsZip(selectedZipIds),
        'Đang đóng gói phiếu tài khoản (.zip)... Vui lòng chờ'
      );
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Đặt tên file trực tiếp theo mã ca thi (không phụ thuộc header Content-Disposition — header
      // này không được CORS "expose" cho JS đọc khi FE/BE khác origin, nên luôn lấy fallback trước đây).
      a.download = `${turnCode}-phieu-tai-khoan.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      openSnackbar({ open: true, message: 'Tải phiếu tài khoản thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setZipping(false);
    }
  };

  return (
    <MainCard
      title={council ? `Ca thi - Hội đồng thi ${council.code} - ${council.desc || ''}` : 'Ca thi'}
      secondary={
        <Link component={RouterLink} to="/council-mgmt/councils" underline="none">
          <Button startIcon={<ArrowLeftOutlined />}>Quay lại hội đồng thi</Button>
        </Link>
      }
    >
      {turns.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
          Chưa có ca thi
        </Typography>
      )}

      {turns.map((turn) => {
        const details = [...(turnDetailsByCode[turn.code] || [])].sort((a, b) =>
          a.room.code.localeCompare(b.room.code, 'vi', { numeric: true, sensitivity: 'base' })
        );
        const allSelected = details.length > 0 && selectedZipIds.length === details.length;
        const someSelected = selectedZipIds.length > 0 && !allSelected;
        const dataStatus = getTurnDataStatus(turn);
        return (
          <Accordion key={turn.code} expanded={expandedTurnCode === turn.code} onChange={handleAccordionChange(turn.code)}>
            <AccordionSummary expandIcon={<DownOutlined />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                <Typography sx={{ fontWeight: 500, minWidth: 160 }}>
                  {turn.code} - {formatTurnLabel(turn)}
                </Typography>
                <Chip label={`${turn.no_rooms} phòng`} size="small" />
                <Chip label={turn.status ? 'Sử dụng' : 'Ẩn'} color={turn.status ? 'success' : 'default'} size="small" />
                <Chip label={dataStatus.label} color={dataStatus.color} size="small" icon={TURN_STATUS_ICONS[dataStatus.key]} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FileExcelOutlined />}
                  sx={{ ml: 'auto' }}
                  disabled={monitorExportingCode === turn.code}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportMonitorAccounts(turn.code);
                  }}
                >
                  {monitorExportingCode === turn.code ? 'Đang tải...' : 'Tải tài khoản cán bộ coi thi'}
                </Button>
                <Tooltip title="Chỉnh sửa ca thi">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(turn);
                    }}
                  >
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {turnDetailsLoading[turn.code] ? (
                <Typography color="text.secondary">Đang tải...</Typography>
              ) : details.length === 0 ? (
                <Typography color="text.secondary">Ca thi này chưa gán phòng thi nào.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={(e) =>
                            setSelectedZipIds(e.target.checked ? details.map((d) => d.council_turn_room_id) : [])
                          }
                        />
                      }
                      label="Chọn tất cả"
                    />
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<FileZipOutlined />}
                      disabled={selectedZipIds.length === 0 || zipping}
                      onClick={() => handleDownloadZip(turn.code)}
                    >
                      {zipping ? 'Đang đóng gói...' : `Tải phiếu tài khoản đã chọn (.zip) (${selectedZipIds.length})`}
                    </Button>
                  </Stack>
                  {details.map((detail) => (
                    <Box key={detail.council_turn_room_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={0.5}>
                          <Checkbox
                            size="small"
                            checked={selectedZipIds.includes(detail.council_turn_room_id)}
                            onChange={(e) => toggleZipSelection(detail.council_turn_room_id, e.target.checked)}
                            sx={{ p: 0 }}
                          />
                          <Typography sx={{ fontWeight: 500, minWidth: 140 }}>
                            {detail.room.code} - {detail.room.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Số máy: {detail.room.no_slots ?? '—'}
                          </Typography>
                          {detail.monitor ? (
                            <Typography variant="body2">
                              Giám thị: {detail.monitor.name} — Tài khoản: <strong>{detail.monitor.code}</strong> / Mật khẩu:{' '}
                              <strong>{detail.monitor.password}</strong>
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="warning.main">
                              Chưa gán giám thị
                            </Typography>
                          )}
                          <Chip
                            label={detail.is_active ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                            color={detail.is_active ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                          {!detail.is_active && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<ThunderboltOutlined />}
                              onClick={() => setActivateTarget(detail)}
                            >
                              Kích hoạt phòng thi
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TeamOutlined />}
                            onClick={() => setExamineeDialog({ ...detail, turnName: turn.name })}
                          >
                            Xem danh sách thí sinh ({detail.examinee_count})
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FileWordOutlined />}
                            disabled={exportingId === detail.council_turn_room_id}
                            onClick={() => handleExportAccounts(detail)}
                          >
                            {exportingId === detail.council_turn_room_id ? 'Đang xuất...' : 'Xuất phiếu tài khoản'}
                          </Button>
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

      {/* Dialog sửa ca thi: ngày giờ + phòng thi trong cùng 1 giao diện, chỉ lưu khi nhấn Lưu */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        {editingTurn && (
          <Formik
            enableReinitialize
            initialValues={editingTurn}
            validationSchema={Yup.object().shape({
              name: Yup.string().max(100).required('Bắt buộc nhập tên ca thi'),
              start_at: Yup.string().required('Bắt buộc nhập ngày giờ thi')
            })}
            onSubmit={handleSubmitEdit}
          >
            {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
              <form noValidate onSubmit={submitForm}>
                <DialogTitle>Sửa ca thi {editingTurn.code}</DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      label="Ca thi"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.name && errors.name)}
                      helperText={touched.name && errors.name}
                    />
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Ngày giờ thi"
                      name="start_at"
                      InputLabelProps={{ shrink: true }}
                      value={values.start_at ? String(values.start_at).slice(0, 16) : ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.start_at && errors.start_at)}
                      helperText={touched.start_at && errors.start_at}
                    />
                    <FormControlLabel
                      control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                      label="Sử dụng"
                    />

                    <Typography variant="subtitle1">Phòng thi</Typography>
                    {roomsLoading ? (
                      <Typography color="text.secondary">Đang tải phòng thi...</Typography>
                    ) : rooms.length === 0 ? (
                      <Typography color="text.secondary">Điểm thi này chưa có phòng thi nào.</Typography>
                    ) : (
                      <Grid container spacing={1}>
                        {rooms.map((room) => {
                          const checked = selectedRoomCodes.includes(room.code);
                          return (
                            <Grid item xs={6} sm={4} key={room.code}>
                              <Box
                                sx={{
                                  border: '1px solid',
                                  borderColor: checked ? 'primary.main' : 'divider',
                                  borderRadius: 1,
                                  px: 1
                                }}
                              >
                                <FormControlLabel
                                  sx={{ width: '100%', m: 0 }}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={checked}
                                      onChange={(e) => toggleRoomSelection(room.code, e.target.checked)}
                                    />
                                  }
                                  label={
                                    <Typography variant="body2" noWrap>
                                      {room.code} - {room.name}
                                    </Typography>
                                  }
                                />
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setEditDialogOpen(false)}>Huỷ</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Lưu
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        )}
      </Dialog>

      {/* Dialog danh sách thí sinh của 1 phòng thi */}
      <Dialog open={!!examineeDialog} onClose={() => setExamineeDialog(null)} fullWidth maxWidth="lg">
        <DialogTitle>
          Danh sách thí sinh - {examineeDialog?.turnName} - {examineeDialog?.room?.name}
        </DialogTitle>
        <DialogContent dividers>
          {!examineeDialog || examineeDialog.examinees.length === 0 ? (
            <Typography color="text.secondary">Chưa có thí sinh trong phòng này.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vị trí máy</TableCell>
                    <TableCell>IP máy</TableCell>
                    <TableCell>CCCD/MSSV</TableCell>
                    <TableCell>Họ lót</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Môn thi</TableCell>
                    <TableCell>Tài khoản</TableCell>
                    <TableCell>Mật khẩu</TableCell>
                    <TableCell>Loại tài khoản</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examineeDialog.examinees.map((examinee) => (
                    <TableRow key={examinee.code}>
                      <TableCell>{examinee.seat_number ?? '—'}</TableCell>
                      <TableCell>{examinee.ip_address || '—'}</TableCell>
                      <TableCell>{examinee.id_card_number}</TableCell>
                      <TableCell>{examinee.lastname}</TableCell>
                      <TableCell>{examinee.firstname}</TableCell>
                      <TableCell>{examinee.subject || '—'}</TableCell>
                      <TableCell>{examinee.username || '—'}</TableCell>
                      <TableCell>{examinee.password}</TableCell>
                      <TableCell>
                        {examinee.is_backup ? (
                          <Chip label="Dự phòng" size="small" color="warning" />
                        ) : (
                          <Chip label="Chính thức" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={examinee.exam_status} size="small" color={examStatusColor(examinee.exam_status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExamineeDialog(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận kích hoạt phòng thi */}
      <Dialog open={!!activateTarget} onClose={() => setActivateTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Xác nhận kích hoạt phòng thi</DialogTitle>
        <DialogContent>
          <Typography>
            Kích hoạt phòng <strong>{activateTarget?.room?.code}</strong>? Thí sinh trong phòng sẽ được phép bắt đầu làm bài thi.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateTarget(null)}>Huỷ</Button>
          <Button variant="contained" color="warning" disabled={activating} onClick={confirmActivateRoom}>
            Kích hoạt
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default CouncilTurnsPage;
