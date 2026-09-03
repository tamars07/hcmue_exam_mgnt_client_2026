import { useEffect, useState } from 'react';

// material-ui
import { Alert, Button, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DownloadOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import gradingService from 'services/grading.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useSubjects from 'hooks/useSubjects';

const emptyGroup = { name: '', matrix_location_from: 1, matrix_location_to: 1, coefficient: 1, order: 0 };

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

// ==============================|| B8 - CÔNG THỨC ĐIỂM + BẢNG ĐIỂM ||============================== //

const ResultsPage = () => {
  const { withLoading } = useLoadingOverlay();
  const subjects = useSubjects();
  const [subjectId, setSubjectId] = useState('');
  const [councilTurnCode, setCouncilTurnCode] = useState('');

  const [divisor, setDivisor] = useState(1);
  const [groups, setGroups] = useState([]);

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    if (!subjectId) return;
    gradingService
      .getScoreFormula(subjectId)
      .then((res) => {
        setDivisor(res.data.data.divisor);
        setGroups(res.data.data.groups.length ? res.data.data.groups : [{ ...emptyGroup }]);
      })
      .catch(() => {});
  }, [subjectId]);

  const handleSaveFormula = async () => {
    try {
      const res = await withLoading(
        () => gradingService.updateScoreFormula(subjectId, { divisor: Number(divisor), groups }),
        'Đang lưu công thức... Vui lòng chờ'
      );
      setGroups(res.data.data.groups);
      openSnackbar({ open: true, message: 'Đã lưu công thức tổng hợp điểm', variant: 'alert', alert: { color: 'success' } });
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lưu thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const updateGroupField = (index, field, value) => {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const handleViewResults = async () => {
    if (!subjectId || !councilTurnCode.trim()) {
      return openSnackbar({ open: true, message: 'Chọn môn thi và nhập mã ca thi', variant: 'alert', alert: { color: 'warning' } });
    }
    setResultsLoading(true);
    try {
      const res = await gradingService.getResultsSummary({ subject_id: subjectId, council_turn_code: councilTurnCode.trim() });
      setResults(res.data.data);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được kết quả', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setResultsLoading(false);
    }
  };

  const handleDownload = async (which) => {
    const params = { subject_id: subjectId, council_turn_code: councilTurnCode.trim() };
    if (!subjectId || !params.council_turn_code) {
      return openSnackbar({ open: true, message: 'Chọn môn thi và nhập mã ca thi', variant: 'alert', alert: { color: 'warning' } });
    }
    try {
      const res = await withLoading(
        () => (which === 'summary' ? gradingService.downloadResultsSummaryXlsx(params) : gradingService.downloadResultsDetailXlsx(params)),
        'Đang xuất file... Vui lòng chờ'
      );
      downloadBlob(res.data, `${which === 'summary' ? 'bang-diem-tong-hop' : 'bang-diem-chi-tiet'}-${params.council_turn_code}.xlsx`);
    } catch (e) {
      openSnackbar({ open: true, message: 'Xuất file thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const columns = [
    { field: 'examinee_test_code', headerName: 'Mã phách', width: 180 },
    {
      field: 'final_score',
      headerName: 'Điểm tổng hợp',
      width: 140,
      valueGetter: (value) => Number(value).toFixed(2)
    },
    {
      field: 'raw_total',
      headerName: 'Tổng điểm thô',
      width: 140,
      valueGetter: (value) => Number(value).toFixed(2)
    }
  ];

  return (
    <Stack spacing={3}>
      <MainCard title="Cấu hình công thức tổng hợp điểm">
        <Stack spacing={2}>
          <Typography variant="body2" color="textSecondary">
            final = (Σ điểm mỗi nhóm câu × hệ số nhóm) / mẫu số. Chưa cấu hình nhóm nào = cộng dồn thường (mẫu số 1).
          </Typography>
          <TextField
            select
            size="small"
            label="Môn thi"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            sx={{ maxWidth: 240 }}
          >
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>

          {subjectId && (
            <>
              <TextField
                type="number"
                size="small"
                label="Mẫu số chung (divisor)"
                value={divisor}
                onChange={(e) => setDivisor(e.target.value)}
                sx={{ maxWidth: 200 }}
              />
              {groups.map((g, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="Tên nhóm"
                    value={g.name}
                    onChange={(e) => updateGroupField(index, 'name', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Từ câu"
                    value={g.matrix_location_from}
                    onChange={(e) => updateGroupField(index, 'matrix_location_from', e.target.value)}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Đến câu"
                    value={g.matrix_location_to}
                    onChange={(e) => updateGroupField(index, 'matrix_location_to', e.target.value)}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Hệ số"
                    value={g.coefficient}
                    onChange={(e) => updateGroupField(index, 'coefficient', e.target.value)}
                    sx={{ width: 100 }}
                  />
                  <Button color="error" onClick={() => setGroups((prev) => prev.filter((_, i) => i !== index))}>
                    Xoá
                  </Button>
                </Stack>
              ))}
              <Stack direction="row" spacing={2}>
                <Button startIcon={<PlusOutlined />} onClick={() => setGroups((prev) => [...prev, { ...emptyGroup, order: prev.length }])}>
                  Thêm nhóm
                </Button>
                <Button variant="contained" startIcon={<SaveOutlined />} onClick={handleSaveFormula}>
                  Lưu công thức
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </MainCard>

      <Divider />

      <MainCard title="Bảng điểm">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="center">
            <TextField
              size="small"
              label="Mã ca thi"
              value={councilTurnCode}
              onChange={(e) => setCouncilTurnCode(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" onClick={handleViewResults}>
              Xem điểm
            </Button>
            <Button startIcon={<DownloadOutlined />} onClick={() => handleDownload('summary')}>
              Tải bảng tổng hợp
            </Button>
            <Button startIcon={<DownloadOutlined />} onClick={() => handleDownload('detail')}>
              Tải bảng chi tiết
            </Button>
          </Stack>

          {results.length === 0 ? (
            <Alert severity="info">Chưa có dữ liệu — chọn môn thi, nhập mã ca thi rồi bấm &quot;Xem điểm&quot;.</Alert>
          ) : (
            <DataGrid
              autoHeight
              rows={results}
              getRowId={(row) => row.examinee_test_code}
              columns={columns}
              loading={resultsLoading}
              disableRowSelectionOnClick
              hideFooter
            />
          )}
        </Stack>
      </MainCard>
    </Stack>
  );
};

export default ResultsPage;
