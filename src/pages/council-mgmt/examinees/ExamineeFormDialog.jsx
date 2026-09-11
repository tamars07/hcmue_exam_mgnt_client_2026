import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField
} from '@mui/material';

// third-party
import { Formik } from 'formik';

// project import
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';
import { formatTurnLabel } from 'utils/council-schedule';

// ==============================|| THÊM/SỬA 1 THÍ SINH THỦ CÔNG ||============================== //
// Bù cho màn hình GroceryCRUD cũ đã gỡ — chỉ dùng khi cần chỉnh 1 thí sinh lẻ, việc nhập hàng loạt
// vẫn nên dùng "Import từ Excel". council_code/council_turn_code/account cố định sau khi tạo.

const emptyValues = {
  code: '',
  id_card_number: '',
  lastname: '',
  firstname: '',
  birthday: '',
  account: '',
  password: '',
  seat_number: 0,
  subject_id: '',
  council_turn_code: '',
  room_code: '',
  is_backup: false
};

const ExamineeFormDialog = ({ open, onClose, editing, defaultCouncilCode, defaultTurnCode, onSaved }) => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  const initialValues = editing
    ? {
        code: editing.code || '',
        id_card_number: editing.id_card_number || '',
        lastname: editing.lastname || '',
        firstname: editing.firstname || '',
        birthday: '',
        account: editing.username || '',
        password: '',
        seat_number: editing.seat_number || 0,
        subject_id: editing.subject_id || '',
        council_turn_code: editing.council_turn_code || '',
        room_code: editing.room_code || '',
        is_backup: !!editing.is_backup
      }
    : { ...emptyValues, council_turn_code: defaultTurnCode || '' };

  useEffect(() => {
    if (!open || !defaultCouncilCode) {
      setTurns([]);
      return;
    }
    councilMgmtService
      .getCouncilTurns(defaultCouncilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [open, defaultCouncilCode]);

  const loadRooms = (turnCode) => {
    if (!turnCode) {
      setRooms([]);
      return;
    }
    councilMgmtService
      .getCouncilTurnDetails(turnCode)
      .then((res) => setRooms(res.data.data.map((d) => d.room).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }))))
      .catch(() => setRooms([]));
  };

  useEffect(() => {
    if (open) loadRooms(initialValues.council_turn_code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validate = (values) => {
    const errors = {};
    if (!values.code) errors.code = 'Bắt buộc nhập SBD';
    if (!values.lastname) errors.lastname = 'Bắt buộc nhập họ lót';
    if (!values.firstname) errors.firstname = 'Bắt buộc nhập tên';
    if (!values.subject_id) errors.subject_id = 'Bắt buộc chọn môn thi';
    if (!values.room_code) errors.room_code = 'Bắt buộc chọn phòng thi';
    if (!editing) {
      if (!values.council_turn_code) errors.council_turn_code = 'Bắt buộc chọn ca thi';
      if (!values.account) errors.account = 'Bắt buộc nhập tài khoản';
    }
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      await withLoading(async () => {
        if (editing) {
          await councilMgmtService.updateExaminee(editing.id, {
            code: values.code,
            id_card_number: values.id_card_number,
            lastname: values.lastname,
            firstname: values.firstname,
            birthday: values.birthday || undefined,
            seat_number: values.seat_number,
            subject_id: values.subject_id,
            room_code: values.room_code,
            is_backup: values.is_backup
          });
        } else {
          await councilMgmtService.createExaminee({
            ...values,
            council_code: defaultCouncilCode,
            birthday: values.birthday || undefined,
            password: values.password || undefined
          });
        }
      }, 'Đang lưu thí sinh... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Lưu thành công', variant: 'alert', alert: { color: 'success' } });
      onSaved?.();
      onClose();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik enableReinitialize initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
          <form noValidate onSubmit={submitForm}>
            <DialogTitle>{editing ? 'Sửa thí sinh' : 'Thêm thí sinh'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="SBD"
                  name="code"
                  value={values.code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.code && errors.code)}
                  helperText={touched.code && errors.code}
                />
                <TextField
                  fullWidth
                  label="CCCD/MSSV"
                  name="id_card_number"
                  value={values.id_card_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText="Để trống sẽ lấy theo SBD"
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Họ lót"
                    name="lastname"
                    value={values.lastname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.lastname && errors.lastname)}
                    helperText={touched.lastname && errors.lastname}
                  />
                  <TextField
                    fullWidth
                    label="Tên"
                    name="firstname"
                    value={values.firstname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.firstname && errors.firstname)}
                    helperText={touched.firstname && errors.firstname}
                  />
                </Stack>
                <TextField
                  fullWidth
                  type="date"
                  label="Ngày sinh"
                  name="birthday"
                  InputLabelProps={{ shrink: true }}
                  value={values.birthday}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {!editing && (
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      label="Tài khoản"
                      name="account"
                      value={values.account}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.account && errors.account)}
                      helperText={touched.account && errors.account}
                    />
                    <TextField
                      fullWidth
                      label="Mật khẩu"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      helperText="Để trống sẽ tự sinh ngẫu nhiên"
                    />
                  </Stack>
                )}
                <TextField
                  fullWidth
                  select
                  label="Môn thi"
                  name="subject_id"
                  value={values.subject_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.subject_id && errors.subject_id)}
                  helperText={touched.subject_id && errors.subject_id}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Ca thi"
                  name="council_turn_code"
                  value={values.council_turn_code}
                  disabled={!!editing}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldValue('room_code', '');
                    loadRooms(e.target.value);
                  }}
                  onBlur={handleBlur}
                  error={Boolean(touched.council_turn_code && errors.council_turn_code)}
                  helperText={(touched.council_turn_code && errors.council_turn_code) || (editing && 'Không thể đổi ca thi sau khi tạo')}
                >
                  {turns.map((t) => (
                    <MenuItem key={t.code} value={t.code}>
                      {formatTurnLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Phòng thi"
                  name="room_code"
                  value={values.room_code}
                  disabled={!values.council_turn_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(touched.room_code && errors.room_code)}
                  helperText={touched.room_code && errors.room_code}
                >
                  {rooms.map((r) => (
                    <MenuItem key={r.code} value={r.code}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  type="number"
                  label="Vị trí máy"
                  name="seat_number"
                  value={values.seat_number}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FormControlLabel
                  control={
                    <Switch checked={!!values.is_backup} onChange={(e) => setFieldValue('is_backup', e.target.checked)} />
                  }
                  label="Thí sinh dự phòng"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Huỷ</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Lưu
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
};

ExamineeFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editing: PropTypes.object,
  defaultCouncilCode: PropTypes.string,
  defaultTurnCode: PropTypes.string,
  onSaved: PropTypes.func
};

export default ExamineeFormDialog;
