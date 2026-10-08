import { useCallback, useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import systemAdminService from 'services/system-admin.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useConfirm from 'hooks/useConfirm';

// ==============================|| KHO DỮ LIỆU DÙNG CHUNG - MÔN THI ||============================== //
// Nguồn dùng chung cho Môn thi, áp dụng vào 1 DB kỳ thi ở 2 thời điểm: (1) lúc tạo DB mới (xem
// CreateDatabaseDialog), (2) đồng bộ thủ công vào 1 DB đã tồn tại (nút "Đồng bộ" dưới đây, giống
// trang Địa điểm thi). Khác Địa điểm thi/Phòng thi: `subjects` của từng hội đồng có thể đã gắn
// tests/questions/điểm số thật — backend TỰ BỎ QUA (không ghi đè) môn nào đã có dữ liệu liên kết,
// xem MasterDataApplyService::applySubject(). Ngoài tự thêm tay, có 2 cách nhập hàng loạt: "Import
// Excel" (file tự chuẩn bị, cột ma_mon_thi/ten_mon_thi/su_dung — xem MasterSubjectController::
// importExcel()) và "Nhập từ file qbank (JSON)" — file JSON xuất ra từ trang Môn học của phân hệ
// qbank (hcmue_qbank_client_2026) để 2 phân hệ khớp dữ liệu môn thi mà không cần gõ tay lại (xem
// MasterSubjectController::import()). Cả 2 chỉ tạo/cập nhật kho dùng chung, không đụng DB hội đồng
// thi nào.

const emptyValues = { code: '', name: '', status: true };

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const SubjectsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [syncTarget, setSyncTarget] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [syncDbId, setSyncDbId] = useState('');

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [excelImportResult, setExcelImportResult] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemAdminService.getMasterSubjects();
      setRows(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Xoá môn thi',
      message: `Xoá môn thi "${row.name}" khỏi kho dữ liệu dùng chung? (không ảnh hưởng dữ liệu đã đồng bộ vào các DB kỳ thi trước đó)`,
      confirmText: 'Xoá',
      confirmColor: 'error'
    });
    if (!ok) return;
    try {
      await withLoading(() => systemAdminService.deleteMasterSubject(row.id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      await withLoading(async () => {
        if (editing) {
          return systemAdminService.updateMasterSubject(editing.id, values);
        }
        return systemAdminService.createMasterSubject(values);
      }, 'Đang lưu... Vui lòng chờ');

      openSnackbar({ open: true, message: 'Lưu thành công', variant: 'alert', alert: { color: 'success' } });
      setDialogOpen(false);
      fetchRows();
    } catch (e) {
      if (e?.data) setErrors(Object.fromEntries(Object.entries(e.data).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSync = (row) => {
    setSyncTarget(row);
    setSyncDbId('');
    if (databases.length === 0) {
      systemAdminService
        .getExamDatabases()
        .then((res) => setDatabases(res.data.data))
        .catch(() => {});
    }
  };

  const handleSync = async () => {
    if (!syncDbId) return;
    try {
      const res = await withLoading(() => systemAdminService.syncMasterSubjects(syncDbId, [syncTarget.id]), 'Đang đồng bộ... Vui lòng chờ');
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: res.data.data.skipped.length ? 'warning' : 'success' } });
      setSyncTarget(null);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Đồng bộ thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleOpenImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportDialogOpen(true);
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const res = await withLoading(() => systemAdminService.importMasterSubjects(importFile), 'Đang nhập dữ liệu... Vui lòng chờ');
      setImportResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Nhập dữ liệu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleImportExcel = async (file) => {
    if (!file) return;
    try {
      const res = await withLoading(() => systemAdminService.importMasterSubjectsExcel(file), 'Đang import... Vui lòng chờ');
      setExcelImportResult(res.data.data);
      openSnackbar({ open: true, message: res.data.message, variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Import thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await systemAdminService.downloadMasterSubjectImportTemplate();
      downloadBlob(res.data, 'Mau_import_mon_thi.xlsx');
    } catch (e) {
      openSnackbar({ open: true, message: 'Tải file mẫu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleExport = async () => {
    try {
      const res = await withLoading(() => systemAdminService.exportMasterSubjects(), 'Đang xuất file... Vui lòng chờ');
      downloadBlob(res.data, `Mon_thi_${Date.now()}.xlsx`);
    } catch (e) {
      openSnackbar({ open: true, message: 'Xuất file thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <MainCard
      title="Môn thi"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Tooltip title='Cột: ma_mon_thi/ten_mon_thi/su_dung — hoặc code/name/status (đúng file .xlsx xuất từ nút "Xuất file Excel" ở trang Môn học bên qbank)'>
            <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => {
                  handleImportExcel(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </Button>
          </Tooltip>
          <Button variant="outlined" startIcon={<UploadOutlined />} onClick={handleOpenImport}>
            Nhập từ file qbank (JSON)
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
            Thêm môn thi
          </Button>
        </Stack>
      }
    >
      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                <Chip label={row.status ? 'Sử dụng' : 'Ẩn'} color={row.status ? 'success' : 'default'} size="small" />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Đồng bộ vào 1 DB kỳ thi">
                    <IconButton size="small" onClick={() => handleOpenSync(row)}>
                      <SyncOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xoá">
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          )}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có môn thi nào trong kho dữ liệu dùng chung
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập mã'),
            name: Yup.string().max(255).required('Bắt buộc nhập tên')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa môn thi' : 'Thêm môn thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {!editing && <DialogContentText>Môn thi này sẽ có thể chọn áp dụng khi tạo DB kỳ thi mới.</DialogContentText>}
                  <TextField
                    fullWidth
                    label="Mã"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    error={Boolean(touched.code && errors.code)}
                    helperText={touched.code && errors.code}
                  />
                  <TextField
                    fullWidth
                    label="Tên"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.name && errors.name)}
                    helperText={touched.name && errors.name}
                  />
                  {editing && (
                    <FormControlLabel
                      control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                      label="Sử dụng"
                    />
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Huỷ</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  Lưu
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nhập môn thi từ file qbank (JSON)</DialogTitle>
        <DialogContent>
          {!importResult ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Chọn file JSON xuất ra từ trang “Môn học” của phân hệ Ngân hàng câu hỏi. Môn thi trùng mã sẽ được cập nhật tên/trạng
                thái, môn chưa có sẽ được tạo mới trong kho dữ liệu dùng chung — không ảnh hưởng DB hội đồng thi nào.
              </DialogContentText>
              <Button component="label" variant="outlined" startIcon={<UploadOutlined />}>
                {importFile ? importFile.name : 'Chọn file .json'}
                <input type="file" hidden accept=".json,application/json" onChange={(e) => setImportFile(e.target.files[0] || null)} />
              </Button>
            </>
          ) : (
            <Stack spacing={1}>
              <Typography variant="body2">Đã tạo mới ({importResult.created.length}): {importResult.created.join(', ') || '—'}</Typography>
              <Typography variant="body2">Đã cập nhật ({importResult.updated.length}): {importResult.updated.join(', ') || '—'}</Typography>
              {importResult.invalid.length > 0 && (
                <Typography variant="body2" color="error">
                  Bỏ qua {importResult.invalid.length} dòng thiếu mã/tên
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!importResult ? (
            <>
              <Button onClick={() => setImportDialogOpen(false)}>Huỷ</Button>
              <Button variant="contained" disabled={!importFile} onClick={handleImport}>
                Nhập
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                setImportDialogOpen(false);
                setImportResult(null);
              }}
            >
              Đóng
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={!!excelImportResult} onClose={() => setExcelImportResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Kết quả import môn thi (Excel)</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              Đã tạo mới ({excelImportResult?.created?.length || 0}): {excelImportResult?.created?.join(', ') || '—'}
            </Typography>
            <Typography variant="body2">
              Đã cập nhật ({excelImportResult?.updated?.length || 0}): {excelImportResult?.updated?.join(', ') || '—'}
            </Typography>
            {excelImportResult?.errors?.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="body2" color="error.main">
                  {excelImportResult.errors.length} dòng lỗi, không được import:
                </Typography>
                {excelImportResult.errors.map((err) => (
                  <Typography key={err.row_number} variant="body2" color="error.main">
                    Dòng {err.row_number}: {err.reasons.join('; ')}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setExcelImportResult(null)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!syncTarget} onClose={() => setSyncTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Đồng bộ “{syncTarget?.name}”</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Chọn 1 DB kỳ thi để thêm/cập nhật môn thi này cho khớp với kho dùng chung. Nếu môn thi đã có dữ liệu tổ chức thi thật (đề
            thi, câu hỏi, điểm số...) gắn vào ở DB đó, hệ thống sẽ tự động bỏ qua, không ghi đè.
          </DialogContentText>
          <TextField select fullWidth label="Database kỳ thi" value={syncDbId} onChange={(e) => setSyncDbId(e.target.value)}>
            <MenuItem value="">-- Chọn database --</MenuItem>
            {databases.map((db) => (
              <MenuItem key={db.id} value={db.id}>
                {db.label} ({db.db_name}){db.is_active ? ' — đang active' : ''}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncTarget(null)}>Huỷ</Button>
          <Button variant="contained" disabled={!syncDbId} onClick={handleSync}>
            Đồng bộ
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default SubjectsPage;
