import { useEffect, useState, useCallback } from 'react';

// material-ui
import {
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
import councilMgmtService from 'services/council-mgmt.service';
import { getRoleChipColor } from 'utils/role-colors';

// ==============================|| NHẬT KÝ HỆ THỐNG ||============================== //

const ROLE_OPTIONS = [
  { id: 1, label: 'Admin' },
  { id: 2, label: 'Moderator' },
  { id: 3, label: 'Editor' },
  { id: 4, label: 'Cán bộ coi thi' },
  { id: 5, label: 'Examiner' },
  { id: 6, label: 'Reviewer' },
  { id: 7, label: 'Điểm trưởng' },
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

const ActivityLogsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [actionOptions, setActionOptions] = useState([]);
  const [detailRow, setDetailRow] = useState(null);

  const [filters, setFilters] = useState({ username: '', action: '', role_id: '', date_from: '', date_to: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  // Chỉ gọi API sau khi người dùng bấm "Lấy dữ liệu" lần đầu — tránh tải toàn bộ nhật ký ngay khi
  // vào trang (bảng có thể rất lớn theo thời gian sử dụng hệ thống).
  const [hasSearched, setHasSearched] = useState(false);

  const fetchActionOptions = useCallback(() => {
    councilMgmtService
      .getActivityLogActions()
      .then((res) => setActionOptions(res.data.data || []))
      .catch(() => setActionOptions([]));
  }, []);

  useEffect(() => {
    fetchActionOptions();
  }, [fetchActionOptions]);

  const fetchRows = useCallback(async () => {
    if (!hasSearched) return;
    setLoading(true);
    try {
      const res = await councilMgmtService.getActivityLogs({
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
    { field: 'action', headerName: 'Hành động', width: 220 },
    { field: 'council_code', headerName: 'Hội đồng thi', width: 140 },
    { field: 'council_turn_code', headerName: 'Ca thi', width: 140 },
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
    <MainCard title="Nhật ký hệ thống">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={1.5} alignItems="center">
          <TextField
            size="small"
            label="Tài khoản"
            value={filters.username}
            onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            label="Hành động"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            sx={{ minWidth: 200 }}
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
            label="Vai trò"
            value={filters.role_id}
            onChange={(e) => setFilters((f) => ({ ...f, role_id: e.target.value }))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {ROLE_OPTIONS.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="datetime-local"
            label="Từ ngày giờ"
            InputLabelProps={{ shrink: true }}
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Đến ngày giờ"
            InputLabelProps={{ shrink: true }}
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          />
          <Button variant="contained" startIcon={<SearchOutlined />} onClick={handleApplyFilters}>
            Lấy dữ liệu
          </Button>
        </Stack>

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

export default ActivityLogsPage;
