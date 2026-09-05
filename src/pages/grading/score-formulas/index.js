import { useEffect, useState } from 'react';

// material-ui
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useSubjects from 'hooks/useSubjects';
import useLoadingOverlay from 'hooks/useLoadingOverlay';

// ==============================|| B8 - CÔNG THỨC TÍNH ĐIỂM ||============================== //
// 1 công thức gắn với 1 Cấu trúc đề thi (test_forms) + 1 Môn thi — mỗi phần thi (test_form_parts) đã
// định nghĩa sẵn trong cấu trúc đề có 1 hệ số riêng, cộng lại rồi chia cho mẫu số chung.

const emptyForm = { test_form_id: '', subject_id: '', name: '', divisor: 1 };

const ScoreFormulasPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();

  const [testForms, setTestForms] = useState([]);
  const [filterTestFormId, setFilterTestFormId] = useState('');

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [parts, setParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    gradingService
      .getScoreFormulaTestForms()
      .then((res) => setTestForms(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = (model, testFormId) => {
    setLoading(true);
    gradingService
      .getScoreFormulas({ page: model.page, pageSize: model.pageSize, test_form_id: testFormId || undefined })
      .then((res) => {
        setRows(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((e) =>
        openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRows(paginationModel, filterTestFormId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filterTestFormId]);

  const loadPartsForTestForm = async (testFormId, existingGroups) => {
    if (!testFormId) {
      setParts([]);
      return;
    }
    setPartsLoading(true);
    try {
      const res = await gradingService.getScoreFormulaTestFormParts(testFormId);
      const groupByPartId = new Map((existingGroups || []).map((g) => [g.test_form_part_id, g.coefficient]));
      setParts(
        res.data.data.map((p) => ({
          id: p.id,
          label: p.test_part?.part_title || p.test_part?.name || p.desc || `Phần #${p.id}`,
          no_questions: p.no_questions,
          list_questions: p.list_questions,
          coefficient: groupByPartId.has(p.id) ? groupByPartId.get(p.id) : 1
        }))
      );
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách phần thi', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setPartsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setParts([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = async (row) => {
    setEditingId(row.id);
    setDialogOpen(true);
    try {
      const res = await gradingService.getScoreFormula(row.id);
      const detail = res.data.data;
      setForm({
        test_form_id: detail.test_form_id,
        subject_id: detail.subject_id,
        name: detail.name || '',
        divisor: detail.divisor
      });
      await loadPartsForTestForm(detail.test_form_id, detail.groups);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được công thức', variant: 'alert', alert: { color: 'error' } });
      setDialogOpen(false);
    }
  };

  const handleTestFormChange = (value) => {
    setForm((prev) => ({ ...prev, test_form_id: value }));
    loadPartsForTestForm(value);
  };

  const handlePartCoefficientChange = (partId, value) => {
    setParts((prev) => prev.map((p) => (p.id === partId ? { ...p, coefficient: value } : p)));
  };

  const handleSave = async () => {
    if (!form.test_form_id || !form.subject_id) {
      return openSnackbar({ open: true, message: 'Chọn Cấu trúc đề thi và Môn thi', variant: 'alert', alert: { color: 'warning' } });
    }
    if (parts.length === 0) {
      return openSnackbar({ open: true, message: 'Cấu trúc đề này chưa có phần thi nào', variant: 'alert', alert: { color: 'warning' } });
    }
    const payload = {
      test_form_id: form.test_form_id,
      subject_id: form.subject_id,
      name: form.name || undefined,
      divisor: Number(form.divisor),
      groups: parts.map((p) => ({ test_form_part_id: p.id, coefficient: Number(p.coefficient) }))
    };
    try {
      await withLoading(
        () => (editingId ? gradingService.updateScoreFormula(editingId, payload) : gradingService.createScoreFormula(payload)),
        'Đang lưu công thức... Vui lòng chờ'
      );
      openSnackbar({ open: true, message: 'Đã lưu công thức tính điểm', variant: 'alert', alert: { color: 'success' } });
      setDialogOpen(false);
      fetchRows(paginationModel, filterTestFormId);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await withLoading(() => gradingService.deleteScoreFormula(id), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá công thức tính điểm', variant: 'alert', alert: { color: 'success' } });
      fetchRows(paginationModel, filterTestFormId);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Tên công thức', flex: 1, minWidth: 160, valueGetter: (value) => value || '(không đặt tên)' },
    { field: 'test_form', headerName: 'Cấu trúc đề thi', flex: 1, minWidth: 200, valueGetter: (value) => value?.name },
    { field: 'subject', headerName: 'Môn thi', flex: 1, minWidth: 160, valueGetter: (value) => value?.name },
    { field: 'divisor', headerName: 'Mẫu số', width: 100 },
    { field: 'groups_count', headerName: 'Số phần thi', width: 110 },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Sửa">
            <IconButton size="small" sx={{ color: '#1976d2' }} onClick={() => handleOpenEdit(params.row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá">
            <IconButton size="small" color="error" onClick={() => setConfirmDelete(params.row.id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MainCard
      title="Công thức tính điểm"
      content={false}
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm công thức
        </Button>
      }
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          final = (Σ điểm mỗi phần thi × hệ số phần đó) / mẫu số chung. 1 cấu trúc đề thi có thể có nhiều công thức.
        </Typography>
        <TextField
          select
          size="small"
          label="Lọc theo Cấu trúc đề thi"
          value={filterTestFormId}
          onChange={(e) => setFilterTestFormId(e.target.value)}
          sx={{ maxWidth: 280 }}
        >
          <MenuItem value="">-- Tất cả --</MenuItem>
          {testForms.map((tf) => (
            <MenuItem key={tf.id} value={tf.id}>
              {tf.name}
            </MenuItem>
          ))}
        </TextField>

        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          rowCount={total}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Sửa công thức tính điểm' : 'Thêm công thức tính điểm'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Cấu trúc đề thi"
                value={form.test_form_id}
                onChange={(e) => handleTestFormChange(e.target.value)}
              >
                <MenuItem value="">-- Chọn --</MenuItem>
                {testForms.map((tf) => (
                  <MenuItem key={tf.id} value={tf.id}>
                    {tf.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                size="small"
                label="Môn thi"
                value={form.subject_id}
                onChange={(e) => setForm((prev) => ({ ...prev, subject_id: e.target.value }))}
              >
                <MenuItem value="">-- Chọn --</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Tên công thức (không bắt buộc)"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                size="small"
                type="number"
                label="Mẫu số chung"
                value={form.divisor}
                onChange={(e) => setForm((prev) => ({ ...prev, divisor: e.target.value }))}
                sx={{ minWidth: 160 }}
              />
            </Stack>

            {!form.test_form_id ? (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                Chọn Cấu trúc đề thi để hiện danh sách phần thi cần định nghĩa hệ số
              </Typography>
            ) : partsLoading ? (
              <Typography color="text.secondary">Đang tải danh sách phần thi...</Typography>
            ) : parts.length === 0 ? (
              <Typography color="error">Cấu trúc đề này chưa có phần thi nào (test_form_parts)</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Phần thi</TableCell>
                    <TableCell>Số câu</TableCell>
                    <TableCell>Danh sách câu (matrix_location)</TableCell>
                    <TableCell align="center">Hệ số</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.label}</TableCell>
                      <TableCell>{p.no_questions}</TableCell>
                      <TableCell>{p.list_questions}</TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={p.coefficient}
                          onChange={(e) => handlePartCoefficientChange(p.id, e.target.value)}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Xoá công thức tính điểm</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xoá công thức này?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Huỷ</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Xác nhận xoá
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default ScoreFormulasPage;
