import { useState } from 'react';
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
import { UploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| NHẬN ĐỀ THI - DIALOG TẢI FILE + XEM TRƯỚC ||============================== //
// 2 bước: chọn file + mật khẩu -> xem trước (giải mã, không ghi DB) -> xác nhận mới thực sự ghi dữ
// liệu. File .dat được mã hoá AES-128-CTR bằng mật khẩu, đóng gói từ chức năng "Tải bộ đề" ở nơi
// khác (có thể là 1 database "ngân hàng đề" riêng).

const TestMixUploadDialog = ({ open, onClose, turnCode, turnLabel, onImported }) => {
  const { withLoading } = useLoadingOverlay();

  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [preview, setPreview] = useState(null);
  const [importToken, setImportToken] = useState('');

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPassword('');
    setPreview(null);
    setImportToken('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePreview = async () => {
    if (!file || !password) {
      openSnackbar({ open: true, message: 'Vui lòng chọn file và nhập mật khẩu', variant: 'alert', alert: { color: 'warning' } });
      return;
    }
    const formData = new FormData();
    formData.append('testdata', file);
    formData.append('testpassword', password);

    try {
      const res = await withLoading(
        () => chairmanService.previewTestMixImport(turnCode, formData),
        'Đang giải mã và đọc dữ liệu đề thi...'
      );
      setPreview(res.data.data);
      setImportToken(res.data.data.import_token);
      setStep('preview');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không đọc được file dữ liệu đề thi', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await withLoading(() => chairmanService.commitTestMixImport(turnCode, importToken), 'Đang nhận đề thi vào ca thi...');
      const result = res.data.data;
      openSnackbar({
        open: true,
        message: `Đã nhận ${result.imported_count} đề mới${result.already_imported_count ? ` (${result.already_imported_count} đề đã có sẵn, bỏ qua)` : ''}`,
        variant: 'alert',
        alert: { color: 'success' }
      });
      onImported?.();
      handleClose();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Nhận đề thi thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Nhận đề thi — {turnLabel || turnCode}</DialogTitle>
      <DialogContent dividers>
        {step === 'upload' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Chọn file dữ liệu đề thi (.dat) đã đóng gói từ chức năng &quot;Tải bộ đề&quot; và nhập đúng mật khẩu mở đề.
            </Alert>
            <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
              {file ? file.name : 'Chọn file đề thi (.dat)'}
              <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            <TextField fullWidth type="password" label="Mật khẩu mở đề" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Stack>
        )}

        {step === 'preview' && preview && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="success">
              Bộ đề <strong>{preview.test_group?.code}</strong>
              {preview.test_group?.desc ? ` — ${preview.test_group.desc}` : ''}
            </Alert>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Chip label={`${preview.total_mixes} đề trong file`} size="small" />
              <Chip label={`${preview.total_new_mixes} đề mới`} size="small" color="success" />
              <Chip label={`${preview.total_already_imported} đề đã có sẵn`} size="small" color="default" />
              <Chip label={`${preview.total_questions} câu hỏi`} size="small" />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Môn thi</TableCell>
                    <TableCell align="right">Tổng số đề</TableCell>
                    <TableCell align="right">Đề mới</TableCell>
                    <TableCell align="right">Đã có sẵn</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(preview.subjects || []).map((s) => (
                    <TableRow key={s.subject_id}>
                      <TableCell>{s.subject_name || `Môn #${s.subject_id}`}</TableCell>
                      <TableCell align="right">{s.total_mixes}</TableCell>
                      <TableCell align="right">{s.new_mixes}</TableCell>
                      <TableCell align="right">{s.already_imported}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {preview.total_new_mixes === 0 && (
              <Alert severity="warning">Toàn bộ đề trong file này đã được nhận vào ca thi trước đó, không có đề mới nào để thêm.</Alert>
            )}
            <Typography variant="caption" color="text.secondary">
              Bước này chưa ghi dữ liệu — bấm &quot;Xác nhận nhận đề&quot; để hoàn tất.
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Huỷ</Button>
        {step === 'upload' && (
          <Button variant="contained" onClick={handlePreview}>
            Xem trước
          </Button>
        )}
        {step === 'preview' && (
          <>
            <Button onClick={() => setStep('upload')}>Quay lại</Button>
            <Button variant="contained" color="success" onClick={handleConfirm}>
              Xác nhận nhận đề
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

TestMixUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  turnCode: PropTypes.string,
  turnLabel: PropTypes.string,
  onImported: PropTypes.func
};

export default TestMixUploadDialog;
