import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { formatTurnLabel } from 'utils/council-schedule';

// ==============================|| IMPORT THÍ SINH TỪ EXCEL ||============================== //

const ImportExamineeDialog = ({ open, onClose, defaultCouncilCode, defaultTurnCode, defaultRoomCode, onImported }) => {
  const { withLoading } = useLoadingOverlay();
  const [councils, setCouncils] = useState([]);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [councilCode, setCouncilCode] = useState('');
  const [scope, setScope] = useState('turn'); // 'turn' | 'council'
  const [turnCode, setTurnCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [file, setFile] = useState(null);

  const [step, setStep] = useState('select'); // 'select' | 'preview'
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep('select');
    setFile(null);
    setPreviewResult(null);
    setCommitResult(null);
    setCouncilCode(defaultCouncilCode || '');
    setTurnCode(defaultTurnCode || '');
    setRoomCode(defaultRoomCode || '');
    setScope('turn');
    councilMgmtService
      .getLookup('councils')
      .then((res) => setCouncils(res.data.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!councilCode) {
      setTurns([]);
      return;
    }
    councilMgmtService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [councilCode]);

  useEffect(() => {
    if (scope !== 'turn' || !turnCode) {
      setRooms([]);
      return;
    }
    councilMgmtService
      .getCouncilTurnDetails(turnCode)
      .then((res) =>
        setRooms(res.data.data.map((d) => d.room).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
      )
      .catch(() => setRooms([]));
  }, [scope, turnCode]);

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('council_code', councilCode);
      if (scope === 'turn') {
        formData.append('council_turn_code', turnCode);
        if (roomCode) formData.append('room_code', roomCode);
      }
      const res = await withLoading(
        () => councilMgmtService.importExamineesPreview(formData),
        'Đang xem trước file import... Vui lòng chờ'
      );
      setPreviewResult(res.data.data);
      setStep('preview');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xem trước thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await councilMgmtService.downloadExamineeImportTemplate({
        council_code: councilCode || undefined,
        council_turn_code: scope === 'turn' ? turnCode || undefined : undefined
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_import_thi_sinh.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Tải file mẫu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await withLoading(
        () => councilMgmtService.importExamineesCommit({ import_token: previewResult.import_token }),
        'Đang import thí sinh vào hệ thống... Vui lòng chờ'
      );
      setCommitResult(res.data.data);
      openSnackbar({
        open: true,
        message: `Đã import ${res.data.data.imported_count} thí sinh`,
        variant: 'alert',
        alert: { color: 'success' }
      });
      onImported?.();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import danh sách thí sinh từ Excel</DialogTitle>
      <DialogContent dividers>
        {step === 'select' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              select
              label="Hội đồng thi"
              value={councilCode}
              onChange={(e) => {
                setCouncilCode(e.target.value);
                setTurnCode('');
                setRoomCode('');
              }}
            >
              {councils.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.desc || c.code}
                </MenuItem>
              ))}
            </TextField>

            <RadioGroup
              row
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setTurnCode('');
                setRoomCode('');
              }}
            >
              <FormControlLabel value="turn" control={<Radio />} label="Import theo 1 ca thi cụ thể" />
              <FormControlLabel value="council" control={<Radio />} label="Import cho toàn bộ hội đồng thi" />
            </RadioGroup>

            {scope === 'turn' ? (
              <>
                <TextField
                  fullWidth
                  select
                  label="Ca thi"
                  value={turnCode}
                  disabled={!councilCode}
                  onChange={(e) => {
                    setTurnCode(e.target.value);
                    setRoomCode('');
                  }}
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
                  label="Phòng thi (không bắt buộc)"
                  value={roomCode}
                  disabled={!turnCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                >
                  <MenuItem value="">Tất cả phòng thi trong ca thi</MenuItem>
                  {rooms.map((r) => (
                    <MenuItem key={r.code} value={r.code}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            ) : (
              <Alert severity="info">
                File Excel bắt buộc phải có cột <strong>ca_thi</strong>, ghi đúng tên ca thi (ví dụ &quot;Ca thi 1&quot;) để xác định mỗi
                thí sinh thuộc ca thi nào trong hội đồng thi này.
              </Alert>
            )}

            <Alert severity="info">
              Cột <strong>tai_khoan</strong> bắt buộc phải có, không được để trống. Cột <strong>mat_khau</strong> nếu để trống sẽ được hệ
              thống tự sinh ngẫu nhiên 6 chữ số.
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={1}>
              <Button
                variant="text"
                startIcon={<DownloadOutlined />}
                disabled={downloadingTemplate}
                onClick={handleDownloadTemplate}
              >
                {downloadingTemplate ? 'Đang tải file mẫu...' : 'Tải file mẫu'}
              </Button>
              <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
                {file ? file.name : 'Chọn file Excel (.xlsx, .xls)'}
                <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files[0] || null)} />
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 'preview' && previewResult && (
          <Stack spacing={2}>
            {previewResult.missing_columns ? (
              <Alert severity="error">
                File thiếu cột bắt buộc: <strong>{previewResult.missing_columns.join(', ')}</strong>. Vui lòng sửa file và tải lại.
              </Alert>
            ) : (
              <>
                {commitResult ? (
                  <Alert severity="success">
                    Đã import thành công <strong>{commitResult.imported_count}</strong> thí sinh
                    {commitResult.skipped.length > 0 && `, bỏ qua ${commitResult.skipped.length} dòng không hợp lệ.`}
                  </Alert>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Chip label={`Tổng: ${previewResult.summary.total}`} size="small" />
                    <Chip label={`Hợp lệ: ${previewResult.summary.valid}`} color="success" size="small" />
                    <Chip label={`Không hợp lệ: ${previewResult.summary.invalid}`} color="error" size="small" />
                  </Stack>
                )}
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dòng</TableCell>
                        <TableCell>SBD</TableCell>
                        <TableCell>Họ tên</TableCell>
                        <TableCell>Tài khoản</TableCell>
                        <TableCell>Mật khẩu</TableCell>
                        <TableCell>Môn thi</TableCell>
                        <TableCell>Phòng thi</TableCell>
                        {scope === 'council' && <TableCell>Ca thi</TableCell>}
                        <TableCell>Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.rows.map((row) => (
                        <TableRow key={row.row_number} sx={{ bgcolor: row.valid ? undefined : 'error.lighter' }}>
                          <TableCell>{row.row_number}</TableCell>
                          <TableCell>{row.data.sbd}</TableCell>
                          <TableCell>
                            {row.data.ho} {row.data.ten}
                          </TableCell>
                          <TableCell>{row.data.tai_khoan}</TableCell>
                          <TableCell>
                            {row.data.mat_khau}
                            {row.generated?.mat_khau && (
                              <Typography component="span" variant="caption" color="text.secondary">
                                {' '}
                                (tự sinh)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{row.data.mon_thi}</TableCell>
                          <TableCell>{row.data.phong_thi}</TableCell>
                          {scope === 'council' && <TableCell>{row.data.ca_thi}</TableCell>}
                          <TableCell>
                            {row.valid ? (
                              <Chip label="Hợp lệ" size="small" color="success" />
                            ) : (
                              <Typography variant="caption" color="error">
                                {row.reasons.join('; ')}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {step === 'select' && (
          <>
            <Button onClick={onClose}>Huỷ</Button>
            <Button
              variant="contained"
              disabled={!councilCode || (scope === 'turn' && !turnCode) || !file || previewLoading}
              onClick={handlePreview}
            >
              {previewLoading ? 'Đang xem trước...' : 'Xem trước'}
            </Button>
          </>
        )}
        {step === 'preview' && !commitResult && !previewResult?.missing_columns && (
          <>
            <Button onClick={() => setStep('select')}>Quay lại</Button>
            <Button variant="contained" disabled={previewResult.summary.valid === 0 || committing} onClick={handleCommit}>
              {committing ? 'Đang import...' : `Xác nhận Import (${previewResult.summary.valid} dòng)`}
            </Button>
          </>
        )}
        {step === 'preview' && previewResult?.missing_columns && <Button onClick={() => setStep('select')}>Quay lại</Button>}
        {commitResult && <Button onClick={onClose}>Đóng</Button>}
      </DialogActions>
    </Dialog>
  );
};

ImportExamineeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultCouncilCode: PropTypes.string,
  defaultTurnCode: PropTypes.string,
  defaultRoomCode: PropTypes.string,
  onImported: PropTypes.func
};

export default ImportExamineeDialog;
