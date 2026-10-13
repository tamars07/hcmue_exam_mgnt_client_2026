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

// ==============================|| IMPORT DANH SÁCH THÍ SINH (KÈM CẤU HÌNH CA THI) ||============================== //
// Khác hẳn pages/council-mgmt/examinees/ImportExamineeDialog.jsx (trang "Tài khoản thí sinh"): dùng
// chung khung mẫu Excel (15 cột) nhưng không cần chọn sẵn ca thi/phòng thi — cột CA THI (số thứ tự)/
// NGÀY THI/GIỜ THI/PHÒNG THI trong file tự cấu hình ngày giờ + gán phòng cho đúng ca thi của hội
// đồng đang xem; Tài khoản/Mật khẩu luôn tự sinh (không đọc từ file dù có).

const ImportTurnExamineesDialog = ({ open, onClose, councilCode, onImported }) => {
  const { withLoading } = useLoadingOverlay();

  const [file, setFile] = useState(null);
  const [passwordLength, setPasswordLength] = useState('');

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
    setPasswordLength('');
    setPreviewResult(null);
    setCommitResult(null);
  }, [open]);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await councilMgmtService.downloadExamineeImportTemplate({ council_code: councilCode });
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

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (passwordLength) formData.append('password_length', passwordLength);
      const res = await withLoading(
        () => councilMgmtService.importTurnExamineesPreview(councilCode, formData),
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

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await withLoading(
        () => councilMgmtService.importTurnExamineesCommit(councilCode, { import_token: previewResult.import_token }),
        'Đang import thí sinh vào hệ thống... Vui lòng chờ'
      );
      setCommitResult(res.data.data);
      openSnackbar({
        open: true,
        message: `Đã import ${res.data.data.imported_count} thí sinh + ${res.data.data.backup_accounts_count} tài khoản dự phòng`,
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
      <DialogTitle>Import danh sách thí sinh (kèm cấu hình ca thi)</DialogTitle>
      <DialogContent dividers>
        {step === 'select' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Dùng chung khung mẫu Excel với trang &quot;Tài khoản thí sinh&quot;. Cột <strong>CA THI</strong> ghi đúng số thứ tự (1, 2,
              3...) ứng với ca thi trong hội đồng này; cột <strong>NGÀY THI/GIỜ THI/PHÒNG THI</strong> sẽ tự cấu hình ngày giờ và gán
              phòng cho đúng ca thi đó. Cột <strong>TÀI KHOẢN/MẬT KHẨU</strong> không cần điền — hệ thống luôn tự sinh (tài khoản theo
              đúng SBD, tất cả tài khoản thí sinh sẽ cùng 1 độ dài). Mỗi phòng thi được cấu hình sẽ tự tạo thêm 5 tài khoản dự phòng
              (bắt đầu bằng chữ X).
            </Alert>

            <TextField
              type="number"
              label="Độ dài mật khẩu"
              placeholder="Mặc định 6"
              value={passwordLength}
              onChange={(e) => setPasswordLength(e.target.value)}
              helperText="Mật khẩu tự sinh toàn số, không dùng số 0 và 1 (tránh nhầm với O/l)"
              slotProps={{ htmlInput: { min: 4, max: 20 } }}
              sx={{ maxWidth: 240 }}
            />

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
                    Đã import thành công <strong>{commitResult.imported_count}</strong> thí sinh +{' '}
                    <strong>{commitResult.backup_accounts_count}</strong> tài khoản dự phòng
                    {commitResult.skipped.length > 0 && `, bỏ qua ${commitResult.skipped.length} dòng không hợp lệ.`}
                  </Alert>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    <Chip label={`Tổng: ${previewResult.summary.total}`} size="small" />
                    <Chip label={`Hợp lệ: ${previewResult.summary.valid}`} color="success" size="small" />
                    <Chip label={`Không hợp lệ: ${previewResult.summary.invalid}`} color="error" size="small" />
                    {previewResult.account_length && (
                      <Chip label={`Độ dài tài khoản: ${previewResult.account_length}`} size="small" variant="outlined" />
                    )}
                  </Stack>
                )}

                {previewResult.turns?.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ca thi</TableCell>
                          <TableCell>Ngày giờ thi</TableCell>
                          <TableCell>Phòng thi được gán</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewResult.turns.map((t) => (
                          <TableRow key={t.turn_code}>
                            <TableCell>{t.turn_name}</TableCell>
                            <TableCell>{t.start_at || '—'}</TableCell>
                            <TableCell>{t.rooms.map((r) => r.room_name).join(', ') || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dòng</TableCell>
                        <TableCell>SBD</TableCell>
                        <TableCell>Họ tên</TableCell>
                        <TableCell>Tài khoản (tự sinh)</TableCell>
                        <TableCell>Mật khẩu (tự sinh)</TableCell>
                        <TableCell>Môn thi</TableCell>
                        <TableCell>Phòng thi</TableCell>
                        <TableCell>Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.rows.map((row, index) => (
                        <TableRow
                          key={row.row_number ?? `backup-${index}`}
                          sx={{ bgcolor: row.valid ? undefined : 'error.lighter' }}
                        >
                          <TableCell>{row.row_number ?? '—'}</TableCell>
                          <TableCell>{row.data.sbd}</TableCell>
                          <TableCell>
                            {row.data.ho} {row.data.ten}
                            {row.is_backup && <Chip label="Dự phòng" size="small" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>{row.data.tai_khoan}</TableCell>
                          <TableCell>{row.data.mat_khau}</TableCell>
                          <TableCell>{row.data.mon_thi}</TableCell>
                          <TableCell>{row.data.phong_thi}</TableCell>
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
            <Button variant="contained" disabled={!file || previewLoading} onClick={handlePreview}>
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

ImportTurnExamineesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  councilCode: PropTypes.string.isRequired,
  onImported: PropTypes.func
};

export default ImportTurnExamineesDialog;
