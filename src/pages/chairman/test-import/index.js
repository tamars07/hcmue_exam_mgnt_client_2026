import { useEffect, useMemo, useState } from 'react';

// material-ui
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
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
import { LockOutlined, UnlockOutlined, UploadOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { isCouncilRunningToday, formatTurnLabel } from 'utils/council-schedule';
import TestMixUploadDialog from './TestMixUploadDialog';

// ==============================|| NHẬN ĐỀ THI ||============================== //

const computeImportWindow = (council, turn) => {
  if (!council || !turn?.start_at) return null;
  const windowMinutes = council.import_testdata_before_time ?? 60;
  const startAt = new Date(String(turn.start_at).replace(' ', 'T')).getTime();
  const windowStart = startAt - windowMinutes * 60 * 1000;
  const now = Date.now();

  if (now < windowStart) {
    return { status: 'too_early', windowMinutes, windowStart };
  }
  if (now >= startAt) {
    return { status: 'started' };
  }
  return { status: 'open' };
};

const formatDateTime = (ms) =>
  new Date(ms).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const TestImportPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCode, setTurnCode] = useState('');

  const [importedList, setImportedList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        const todayCouncils = (res.data.data || []).filter(isCouncilRunningToday);
        setCouncils(todayCouncils);
        if (todayCouncils.length === 1) setCouncilCode(todayCouncils[0].code);
      })
      .catch(() => openSnackbar({ open: true, message: 'Không tải được hội đồng thi', variant: 'alert', alert: { color: 'error' } }));
  }, []);

  useEffect(() => {
    setTurnCode('');
    setImportedList([]);
    if (!councilCode) {
      setTurns([]);
      return;
    }
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [councilCode]);

  const fetchImportedList = () => {
    if (!turnCode) return;
    setLoadingList(true);
    chairmanService
      .getImportedTestMixes(turnCode)
      .then((res) => setImportedList(res.data.data))
      .catch(() => setImportedList([]))
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    fetchImportedList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnCode]);

  const selectedCouncil = councils.find((c) => c.code === councilCode);
  const selectedTurn = turns.find((t) => t.code === turnCode);
  const importWindow = useMemo(() => computeImportWindow(selectedCouncil, selectedTurn), [selectedCouncil, selectedTurn]);
  const canImport = importWindow?.status === 'open';

  const batches = useMemo(() => {
    const grouped = new Map();
    importedList.forEach((row) => {
      const key = row.test_group_id;
      if (!grouped.has(key)) {
        grouped.set(key, { test_group_id: key, test_group_code: row.test_group_code, rows: [] });
      }
      grouped.get(key).rows.push(row);
    });
    return Array.from(grouped.values());
  }, [importedList]);

  const handleRevoke = async (batch) => {
    if (!window.confirm(`Thu hồi toàn bộ ${batch.rows.length} đề trong gói ${batch.test_group_code} khỏi ca thi này?`)) return;
    try {
      await withLoading(
        () => chairmanService.revokeTestMixBatch(turnCode, batch.test_group_id),
        'Đang thu hồi gói đề...'
      );
      openSnackbar({ open: true, message: 'Đã thu hồi gói đề', variant: 'alert', alert: { color: 'success' } });
      fetchImportedList();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thu hồi thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleToggleLock = async (row) => {
    try {
      await withLoading(
        () => (row.is_locked ? chairmanService.unlockTestMix(row.id) : chairmanService.lockTestMix(row.id)),
        row.is_locked ? 'Đang mở khoá đề thi...' : 'Đang khoá đề thi...'
      );
      fetchImportedList();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Thao tác thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  return (
    <MainCard title="Nhận đề thi">
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          <TextField
            select
            size="small"
            label="Hội đồng thi"
            value={councilCode}
            onChange={(e) => setCouncilCode(e.target.value)}
            sx={{ minWidth: 240 }}
            helperText={councils.length === 0 ? 'Không có hội đồng thi nào diễn ra hôm nay' : ''}
          >
            {councils.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.desc || c.code}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Ca thi"
            value={turnCode}
            disabled={!councilCode}
            onChange={(e) => setTurnCode(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {formatTurnLabel(t)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {!turnCode ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Chọn hội đồng thi và ca thi để nhận đề thi.
          </Typography>
        ) : (
          <>
            {importWindow?.status === 'too_early' && (
              <Alert severity="warning">
                Chưa đến thời điểm nhận đề thi cho ca thi này — mở lúc <strong>{formatDateTime(importWindow.windowStart)}</strong> (trước
                giờ thi {importWindow.windowMinutes} phút).
              </Alert>
            )}
            {importWindow?.status === 'started' && (
              <Alert severity="error">Ca thi đã đến giờ hoặc đã diễn ra, không thể nhận đề thi nữa.</Alert>
            )}

            {canImport && (
              <Box>
                <Button variant="contained" startIcon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
                  Nhận đề thi mới
                </Button>
              </Box>
            )}

            <Typography variant="subtitle1">Danh sách đề thi đã nhận</Typography>
            {loadingList ? (
              <Typography color="text.secondary">Đang tải...</Typography>
            ) : batches.length === 0 ? (
              <Typography color="text.secondary">Ca thi này chưa nhận đề thi nào.</Typography>
            ) : (
              <Stack spacing={2}>
                {batches.map((batch) => {
                  const anyUsed = batch.rows.some((r) => r.is_used);
                  return (
                    <Box key={batch.test_group_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 500 }}>Gói đề {batch.test_group_code}</Typography>
                        <Chip label={`${batch.rows.length} đề`} size="small" />
                        <Chip
                          label={anyUsed ? 'Đã có đề được sử dụng' : 'Chưa sử dụng'}
                          size="small"
                          color={anyUsed ? 'warning' : 'success'}
                        />
                        <Tooltip title={anyUsed ? 'Đã có đề được sử dụng, không thể thu hồi cả gói' : 'Thu hồi toàn bộ gói đề khỏi ca thi'}>
                          <span>
                            <Button size="small" color="error" variant="outlined" disabled={anyUsed} onClick={() => handleRevoke(batch)}>
                              Thu hồi gói đề
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Mã đề</TableCell>
                              <TableCell>Môn thi</TableCell>
                              <TableCell>Trạng thái</TableCell>
                              <TableCell>Thí sinh sử dụng</TableCell>
                              <TableCell>Thời điểm sử dụng</TableCell>
                              <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {batch.rows.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell>{row.test_mix_code}</TableCell>
                                <TableCell>{row.subject_name}</TableCell>
                                <TableCell>
                                  {row.is_used ? (
                                    <Chip label="Đã sử dụng" size="small" color="info" />
                                  ) : row.is_locked ? (
                                    <Chip label="Đã khoá" size="small" color="default" />
                                  ) : (
                                    <Chip label="Chưa sử dụng" size="small" color="success" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.used_by ? `${row.used_by.code} - ${row.used_by.fullname}` : '—'}
                                </TableCell>
                                <TableCell>{row.used_time || '—'}</TableCell>
                                <TableCell align="right">
                                  {!row.is_used && (
                                    <Tooltip title={row.is_locked ? 'Mở khoá' : 'Khoá — không cho gán cho thí sinh mới'}>
                                      <IconButton size="small" onClick={() => handleToggleLock(row)}>
                                        {row.is_locked ? <UnlockOutlined /> : <LockOutlined />}
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Stack>

      <TestMixUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        turnCode={turnCode}
        turnLabel={selectedTurn ? formatTurnLabel(selectedTurn) : ''}
        onImported={fetchImportedList}
      />
    </MainCard>
  );
};

export default TestImportPage;
