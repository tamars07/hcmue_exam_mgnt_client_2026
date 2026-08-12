import { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

// material-ui
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
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
import { ArrowLeftOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';

// ==============================|| COUNCIL TURNS - LIST ||============================== //

const CouncilTurnsPage = () => {
  const { code: councilCode } = useParams();
  const [council, setCouncil] = useState(null);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTurn, setEditingTurn] = useState(null);
  const [roomsDialogTurn, setRoomsDialogTurn] = useState(null);
  const [assignedRooms, setAssignedRooms] = useState([]);

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

  const handleOpenEdit = (turn) => {
    setEditingTurn(turn);
    setEditDialogOpen(true);
  };

  const handleSubmitEdit = async (values, { setSubmitting }) => {
    try {
      await councilMgmtService.updateCouncilTurn(editingTurn.code, values);
      openSnackbar({ open: true, message: 'Lưu thành công', variant: 'alert', alert: { color: 'success' } });
      setEditDialogOpen(false);
      fetchTurns();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const openRoomsDialog = async (turn) => {
    setRoomsDialogTurn(turn);
    try {
      const res = await councilMgmtService.getCouncilTurnRooms(turn.code);
      setAssignedRooms(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được phòng thi', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const toggleRoom = async (roomCode, checked) => {
    try {
      if (checked) {
        await councilMgmtService.assignCouncilTurnRoom({ council_turn_code: roomsDialogTurn.code, room_code: roomCode });
      } else {
        const entry = assignedRooms.find((r) => r.room_code === roomCode);
        if (entry) await councilMgmtService.unassignCouncilTurnRoom(entry.id);
      }
      const res = await councilMgmtService.getCouncilTurnRooms(roomsDialogTurn.code);
      setAssignedRooms(res.data.data);
      fetchTurns();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
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
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã ca thi</TableCell>
              <TableCell>Ca thi</TableCell>
              <TableCell>Ngày giờ thi</TableCell>
              <TableCell>Số phòng thi</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {turns.map((turn) => (
              <TableRow key={turn.code} hover>
                <TableCell>{turn.code}</TableCell>
                <TableCell>{turn.name}</TableCell>
                <TableCell>{turn.start_at}</TableCell>
                <TableCell>{turn.no_rooms}</TableCell>
                <TableCell>
                  <Chip label={turn.status ? 'Sử dụng' : 'Ẩn'} color={turn.status ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => handleOpenEdit(turn)}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gán phòng thi">
                    <IconButton size="small" onClick={() => openRoomsDialog(turn)}>
                      <TeamOutlined />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {turns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography align="center" color="text.secondary">
                    Chưa có ca thi
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog sửa ca thi */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
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

      {/* Dialog gán phòng thi */}
      <Dialog open={!!roomsDialogTurn} onClose={() => setRoomsDialogTurn(null)} fullWidth maxWidth="xs">
        <DialogTitle>Gán phòng thi - {roomsDialogTurn?.code}</DialogTitle>
        <DialogContent>
          <List dense>
            {rooms.map((room) => {
              const checked = assignedRooms.some((r) => r.room_code === room.code);
              return (
                <ListItem
                  key={room.code}
                  secondaryAction={<Checkbox edge="end" checked={checked} onChange={(e) => toggleRoom(room.code, e.target.checked)} />}
                >
                  <ListItemText primary={`${room.code} - ${room.name}`} />
                </ListItem>
              );
            })}
            {rooms.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                Điểm thi này chưa có phòng thi nào.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomsDialogTurn(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default CouncilTurnsPage;
