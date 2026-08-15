import { useEffect, useState, useCallback } from 'react';

// material-ui
import { Button, Chip, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FilterOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import ImportExamineeDialog from './ImportExamineeDialog';

// ==============================|| EXAMINEES - LIST ||============================== //

const ExamineesPage = () => {
  const { withLoading } = useLoadingOverlay();
  const [councils, setCouncils] = useState([]);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [councilCode, setCouncilCode] = useState('');
  const [turnCode, setTurnCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [search, setSearch] = useState('');

  // Tiêu chí lọc chỉ áp dụng vào danh sách khi bấm "Lọc danh sách" — tách khỏi 3 dropdown ở trên
  // để người dùng chọn xong Hội đồng thi/Ca thi/Phòng thi rồi mới xác nhận, tránh gọi API liên tục.
  const [appliedFilters, setAppliedFilters] = useState({ councilCode: '', turnCode: '', roomCode: '' });

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });

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
      .then((res) =>
        setRooms(res.data.data.map((d) => d.room).sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true })))
      )
      .catch(() => setRooms([]));
  }, [turnCode]);

  const fetchRows = useCallback(async () => {
    if (!appliedFilters.councilCode) {
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
        council_code: appliedFilters.councilCode,
        council_turn_code: appliedFilters.turnCode || undefined,
        room_code: appliedFilters.roomCode || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, search, paginationModel]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleApplyFilter = async () => {
    const filters = { councilCode, turnCode, roomCode };
    const pagination = { ...paginationModel, page: 0 };

    try {
      await withLoading(async () => {
        const res = await councilMgmtService.getExaminees({
          page: pagination.page,
          pageSize: pagination.pageSize,
          search,
          council_code: filters.councilCode,
          council_turn_code: filters.turnCode || undefined,
          room_code: filters.roomCode || undefined
        });
        setRows(res.data.data.items);
        setRowCount(res.data.data.total);
      }, 'Đang lọc danh sách... Vui lòng chờ');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Lọc danh sách thất bại', variant: 'alert', alert: { color: 'error' } });
    }

    setAppliedFilters(filters);
    setPaginationModel(pagination);
  };

  const columns = [
    { field: 'council_turn_name', headerName: 'Ca thi', width: 140 },
    { field: 'room_name', headerName: 'Phòng thi', width: 130 },
    { field: 'seat_number', headerName: 'Vị trí máy', width: 100, type: 'number' },
    { field: 'id_card_number', headerName: 'CCCD/MSSV', width: 140 },
    { field: 'lastname', headerName: 'Họ lót', flex: 1, minWidth: 120 },
    { field: 'firstname', headerName: 'Tên', width: 100 },
    { field: 'subject', headerName: 'Môn thi', width: 140 },
    { field: 'username', headerName: 'Tài khoản', width: 160 },
    {
      field: 'is_backup',
      headerName: 'Loại tài khoản',
      width: 130,
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
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap" rowGap={2} columnGap={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap" rowGap={2}>
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
              }}
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
              sx={{ minWidth: 200 }}
              onChange={(e) => {
                setTurnCode(e.target.value);
                setRoomCode('');
              }}
            >
              <MenuItem value="">Tất cả ca thi</MenuItem>
              {turns.map((t) => (
                <MenuItem key={t.code} value={t.code}>
                  {t.name}
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
              onChange={(e) => setRoomCode(e.target.value)}
            >
              <MenuItem value="">Tất cả phòng thi</MenuItem>
              {rooms.map((r) => (
                <MenuItem key={r.code} value={r.code}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" startIcon={<FilterOutlined />} disabled={!councilCode} onClick={handleApplyFilter}>
              Lọc danh sách
            </Button>
          </Stack>

          <TextField
            size="small"
            label="Tìm kiếm"
            placeholder="CCCD/MSSV, họ tên, tài khoản..."
            value={search}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              )
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPaginationModel((m) => ({ ...m, page: 0 }));
            }}
          />
        </Stack>

        {!appliedFilters.councilCode ? (
          <Typography color="text.secondary" sx={{ py: 4 }} align="center">
            Chọn Hội đồng thi (và Ca thi / Phòng thi nếu muốn) rồi bấm &quot;Lọc danh sách&quot; để xem danh sách thí sinh.
          </Typography>
        ) : (
          <>
            <Typography variant="subtitle1" align="center">
              Danh sách có {rowCount} thí sinh
            </Typography>
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
          </>
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
