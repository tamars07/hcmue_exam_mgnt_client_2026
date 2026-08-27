import { useEffect, useState, useCallback } from 'react';

// material-ui
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import { formatTurnLabel } from 'utils/council-schedule';
import { getRoleChipColor } from 'utils/role-colors';

// ==============================|| ĐIỂM TRƯỞNG - NHẬT KÝ KÌ THI ||============================== //
// Chỉ hiện thao tác của Điểm trưởng/Cán bộ coi thi/Thí sinh, trong phạm vi hội đồng thi điểm trưởng
// đang đăng nhập được phân công quản lý — đã lọc sẵn ở backend (ChairmanLogController::activityLogs()),
// không cần bộ lọc theo ngày vì phạm vi dữ liệu đã đủ nhỏ.

const ROLE_OPTIONS = [
  { id: 7, label: 'Điểm trưởng' },
  { id: 4, label: 'Cán bộ coi thi' },
  { id: 8, label: 'Thí sinh' }
];

const formatDesc = (desc) => {
  if (!desc) return '';
  try {
    const parsed = JSON.parse(desc);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return desc;
  }
};

const ChairmanLogsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [actionOptions, setActionOptions] = useState([]);
  const [detailRow, setDetailRow] = useState(null);

  const [councils, setCouncils] = useState([]);
  const [turns, setTurns] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [filters, setFilters] = useState({ username: '', action: '', role_id: '', council_code: '', council_turn_code: '', room_code: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  // Chỉ gọi API sau khi người dùng bấm "Lấy dữ liệu" lần đầu — tránh tải toàn bộ nhật ký ngay khi
  // vào trang.
  const [hasSearched, setHasSearched] = useState(false);

  const fetchActionOptions = useCallback(() => {
    chairmanService
      .getActivityLogActions()
      .then((res) => setActionOptions(res.data.data || []))
      .catch(() => setActionOptions([]));
  }, []);

  useEffect(() => {
    fetchActionOptions();
  }, [fetchActionOptions]);

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => setCouncils(res.data.data || []))
      .catch(() => setCouncils([]));
  }, []);

  // Đổi hội đồng thi -> nạp lại danh sách ca thi, reset lựa chọn ca thi/phòng thi đang chọn (không
  // còn hợp lệ với hội đồng thi mới).
  useEffect(() => {
    setFilters((f) => ({ ...f, council_turn_code: '', room_code: '' }));
    setRooms([]);
    if (!filters.council_code) {
      setTurns([]);
      return;
    }
    chairmanService
      .getCouncilTurns(filters.council_code)
      .then((res) => setTurns(res.data.data || []))
      .catch(() => setTurns([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.council_code]);

  // Đổi ca thi -> nạp lại danh sách phòng thi, reset lựa chọn phòng thi đang chọn.
  useEffect(() => {
    setFilters((f) => ({ ...f, room_code: '' }));
    if (!filters.council_turn_code) {
      setRooms([]);
      return;
    }
    chairmanService
      .getCouncilTurnRooms(filters.council_turn_code)
      .then((res) => setRooms(res.data.data || []))
      .catch(() => setRooms([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.council_turn_code]);

  const fetchRows = useCallback(async () => {
    if (!hasSearched) return;
    setLoading(true);
    try {
      const res = await chairmanService.getActivityLogs({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        ...appliedFilters
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được nhật ký', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, appliedFilters, hasSearched]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleApplyFilters = () => {
    setPaginationModel((m) => ({ ...m, page: 0 }));
    setAppliedFilters(filters);
    setHasSearched(true);
    fetchActionOptions();
  };

  const columns = [
    { field: 'log_time', headerName: 'Thời điểm', width: 160 },
    { field: 'username', headerName: 'Tài khoản', width: 220 },
    {
      field: 'role_name',
      headerName: 'Vai trò',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ bgcolor: getRoleChipColor(params.row.role_id), color: '#fff' }} />
      )
    },
    { field: 'action', headerName: 'Hành động', width: 200 },
    { field: 'council_code', headerName: 'Hội đồng thi', width: 130 },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 130 },
    { field: 'room_code', headerName: 'Phòng thi', width: 120 },
    {
      field: 'detail',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Xem chi tiết">
          <IconButton size="small" onClick={() => setDetailRow(params.row)}>
            <EyeOutlined />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <MainCard title="Nhật ký kì thi">
      <Stack spacing={2}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 1.5 }}>
          <TextField
            size="small"
            select
            fullWidth
            label="Hội đồng thi"
            value={filters.council_code}
            onChange={(e) => setFilters((f) => ({ ...f, council_code: e.target.value }))}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {councils.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.desc || c.code}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            fullWidth
            label="Ca thi"
            value={filters.council_turn_code}
            disabled={!filters.council_code}
            onChange={(e) => setFilters((f) => ({ ...f, council_turn_code: e.target.value }))}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {formatTurnLabel(t)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            fullWidth
            label="Phòng thi"
            value={filters.room_code}
            disabled={!filters.council_turn_code}
            onChange={(e) => setFilters((f) => ({ ...f, room_code: e.target.value }))}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {rooms.map((r) => (
              <MenuItem key={r.room_code} value={r.room_code}>
                {r.room_name || r.room_code}
              </MenuItem>
            ))}
          </TextField>
          <Box />

          <TextField
            size="small"
            fullWidth
            label="Tài khoản"
            value={filters.username}
            onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))}
          />
          <TextField
            size="small"
            select
            fullWidth
            label="Hành động"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {actionOptions.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            fullWidth
            label="Vai trò"
            value={filters.role_id}
            onChange={(e) => setFilters((f) => ({ ...f, role_id: e.target.value }))}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {ROLE_OPTIONS.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<SearchOutlined />} onClick={handleApplyFilters}>
            Lấy dữ liệu
          </Button>
        </Box>

        {!hasSearched ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn điều kiện lọc (nếu cần) rồi bấm &quot;Lấy dữ liệu&quot; để xem nhật ký
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
            pageSizeOptions={[20, 50, 100]}
            disableRowSelectionOnClick
          />
        )}
      </Stack>

      <Dialog open={!!detailRow} onClose={() => setDetailRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Chi tiết nhật ký — {detailRow?.action}</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{formatDesc(detailRow?.desc)}</pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRow(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default ChairmanLogsPage;
