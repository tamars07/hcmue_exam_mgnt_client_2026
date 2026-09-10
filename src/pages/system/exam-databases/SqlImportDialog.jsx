import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { UploadOutlined } from '@ant-design/icons';

// project import
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| IMPORT DỮ LIỆU THEO BẢNG TỪ FILE .SQL ||============================== //

const SqlImportDialog = ({ open, onClose, examDatabase }) => {
  const { withLoading } = useLoadingOverlay();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('select'); // 'select' | 'preview'
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setStep('select');
      setPreviewResult(null);
      setSelectedTables([]);
      setCommitResult(null);
    }
  }, [open]);

  if (!examDatabase) return null;

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await withLoading(
        () => systemAdminService.previewSqlImport(examDatabase.id, formData),
        'Đang phân tích file .sql... Vui lòng chờ'
      );
      setPreviewResult(res.data.data);
      setSelectedTables(res.data.data.tables.filter((t) => t.allowed).map((t) => t.table));
      setStep('preview');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xem trước thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleTable = (table) => {
    setSelectedTables((prev) => (prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]));
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const res = await withLoading(
        () =>
          systemAdminService.commitSqlImport(examDatabase.id, {
            import_token: previewResult.import_token,
            tables: selectedTables
          }),
        'Đang import dữ liệu vào database... Vui lòng chờ'
      );
      setCommitResult(res.data.data);
      openSnackbar({ open: true, message: 'Import hoàn tất', variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Import dữ liệu theo bảng — {examDatabase.label} ({examDatabase.db_name})
      </DialogTitle>
      <DialogContent dividers>
        {step === 'select' && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="error">
              Với mỗi bảng được chọn, hệ thống sẽ <strong>xoá sạch (TRUNCATE) toàn bộ dữ liệu hiện có</strong> của bảng đó rồi mới nạp dữ
              liệu mới từ file vào — không thể hoàn tác. Ràng buộc khoá ngoại sẽ được bỏ qua trong lúc import, nên hãy chọn đầy đủ các
              bảng liên quan để tránh dữ liệu mất nhất quán. Chỉ các bảng dữ liệu nghiệp vụ kỳ thi (địa điểm thi, phòng thi, hội đồng, câu
              hỏi, thí sinh...) mới được phép import — các bảng tài khoản/hệ thống (users, roles, monitors...) sẽ luôn bị loại trừ dù có
              trong file.
            </Alert>
            <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
              {file ? file.name : 'Chọn file .sql hoặc .sql.gz'}
              <input type="file" hidden accept=".sql,.gz" onChange={(e) => setFile(e.target.files[0] || null)} />
            </Button>
          </Stack>
        )}

        {step === 'preview' && previewResult && (
          <Stack spacing={2}>
            {commitResult ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bảng</TableCell>
                    <TableCell>Đã thử</TableCell>
                    <TableCell>Thành công</TableCell>
                    <TableCell>Thất bại</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commitResult.tables.map((t) => (
                    <TableRow key={t.table}>
                      <TableCell>{t.table}</TableCell>
                      <TableCell>{t.attempted}</TableCell>
                      <TableCell>{t.inserted}</TableCell>
                      <TableCell>
                        {t.failed}
                        {t.errors?.length > 0 && (
                          <Tooltip title={t.errors.join('\n')}>
                            <Typography component="span" variant="caption" color="error" sx={{ ml: 1, cursor: 'help' }}>
                              (xem lỗi)
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <>
              <Alert severity="warning">
                Các bảng được tick chọn bên dưới sẽ bị xoá sạch dữ liệu hiện có trước khi nạp dữ liệu mới từ file.
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Bảng</TableCell>
                    <TableCell>Số câu INSERT</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewResult.tables.map((t) => (
                    <TableRow key={t.table}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          disabled={!t.allowed}
                          checked={selectedTables.includes(t.table)}
                          onChange={() => toggleTable(t.table)}
                        />
                      </TableCell>
                      <TableCell>{t.table}</TableCell>
                      <TableCell>{t.statement_count}</TableCell>
                      <TableCell>
                        {t.allowed ? (
                          <Typography variant="caption" color="success.main">
                            Được phép
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error">
                            Không thuộc danh sách bảng dữ liệu thi được phép
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
        {step === 'preview' && !commitResult && (
          <>
            <Button onClick={() => setStep('select')}>Quay lại</Button>
            <Button variant="contained" disabled={selectedTables.length === 0 || committing} onClick={handleCommit}>
              {committing ? 'Đang import...' : `Xác nhận import (${selectedTables.length} bảng)`}
            </Button>
          </>
        )}
        {commitResult && <Button onClick={onClose}>Đóng</Button>}
      </DialogActions>
    </Dialog>
  );
};

SqlImportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  examDatabase: PropTypes.object
};

export default SqlImportDialog;
