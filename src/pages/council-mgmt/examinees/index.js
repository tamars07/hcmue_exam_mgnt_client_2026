import { useEffect, useState, useCallback } from 'react';

// material-ui
import { Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { UploadOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import ImportExamineeDialog from './ImportExamineeDialog';

// ==============================|| EXAMINEES - LIST ||============================== //

const ExamineesPage = () => {
  const [councils, setCouncils] = useState([]);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [councilCode, setCouncilCode] = useState('');
  const [turnCode, setTurnCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [search, setSearch] = useState('');

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    councilMgmtService
      .getLookup('councils')
      .then((res) => setCouncils(res.data.data))
      .catch(() => {});
  }, []);

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
    if (!turnCode) {
      setRooms([]);
      return;
    }
    councilMgmtService
      .getCouncilTurnDetails(turnCode)
      .then((res) => setRooms(res.data.data.map((d) => d.room)))
      .catch(() => setRooms([]));
  }, [turnCode]);

  const fetchRows = useCallback(async () => {
    if (!councilCode || !turnCode) {
      setRows([]);
      setRowCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await councilMgmtService.getExaminees({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        search,
        council_code: councilCode,
        council_turn_code: turnCode,
        room_code: roomCode || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [councilCode, turnCode, roomCode, search, paginationModel]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columns = [
    { field: 'code', headerName: 'SBD', width: 120 },
    { field: 'lastname', headerName: 'Họ lót', flex: 1, minWidth: 120 },
    { field: 'firstname', headerName: 'Tên', width: 100 },
    { field: 'username', headerName: 'Tài khoản', width: 160 },
    { field: 'subject', headerName: 'Môn thi', width: 140 },
    { field: 'room_code', headerName: 'Phòng thi', width: 130 },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 160 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
    },
    {
      field: 'is_backup',
      headerName: 'Dự phòng',
      width: 110,
      renderCell: (params) =>
        params.value ? <Chip label="Dự phòng" size="small" color="warning" /> : <Chip label="Chính thức" size="small" />
    }
  ];

  return (
    <MainCard
      title="Danh sách thí sinh"
      secondary={
        <Button variant="contained" startIcon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          Import từ Excel
        </Button>
      }
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          <TextField
            select
            size="small"
            label="Hội đồng thi"
            value={councilCode}
            sx={{ minWidth: 240 }}
            onChange={(e) => {
              setCouncilCode(e.target.value);
              setTurnCode('');
              setRoomCode('');
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
          >
            {councils.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.code} {c.desc ? `- ${c.desc}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Ca thi"
            value={turnCode}
            disabled={!councilCode}
            sx={{ minWidth: 200 }}
            onChange={(e) => {
              setTurnCode(e.target.value);
              setRoomCode('');
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
          >
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.code} - {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Phòng thi"
            value={roomCode}
            disabled={!turnCode}
            sx={{ minWidth: 200 }}
            onChange={(e) => {
              setRoomCode(e.target.value);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
          >
            <MenuItem value="">Tất cả phòng thi</MenuItem>
            {rooms.map((r) => (
              <MenuItem key={r.code} value={r.code}>
                {r.code} - {r.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Tìm kiếm (SBD / họ tên)"
            value={search}
            sx={{ minWidth: 220 }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
          />
        </Stack>

        {!councilCode || !turnCode ? (
          <Typography color="text.secondary" sx={{ py: 4 }} align="center">
            Chọn Hội đồng thi và Ca thi để xem danh sách thí sinh.
          </Typography>
        ) : (
          <DataGrid
            autoHeight
            rows={rows}
            getRowId={(row) => row.id}
            columns={columns}
            rowCount={rowCount}
            loading={loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
          />
        )}
      </Stack>

      <ImportExamineeDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        defaultCouncilCode={councilCode}
        defaultTurnCode={turnCode}
        defaultRoomCode={roomCode}
        onImported={fetchRows}
      />
    </MainCard>
  );
};

export default ExamineesPage;
