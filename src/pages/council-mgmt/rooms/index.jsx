import { useEffect, useState, useCallback } from 'react';

// material-ui
import { Alert, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';

// ==============================|| ROOMS - LIST (READ-ONLY) ||============================== //
// Thêm/sửa/xoá Phòng thi đã chuyển hẳn sang kho dữ liệu dùng chung ở Quản trị hệ thống — trang này
// chỉ còn xem, tránh 2 nơi cùng ghi gây sai lệch dữ liệu giữa các DB kỳ thi.

const RoomsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getRooms({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        search,
        organization_code: organizationFilter || undefined
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, organizationFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columns = [
    { field: 'code', headerName: 'Mã phòng', width: 120 },
    { field: 'name', headerName: 'Tên phòng', flex: 1, minWidth: 160 },
    { field: 'organization_code', headerName: 'Địa điểm thi', width: 150 },
    { field: 'no_slots', headerName: 'Số máy', width: 100, type: 'number' },
    { field: 'desc', headerName: 'Diễn giải', flex: 1, minWidth: 160 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
    }
  ];

  return (
    <MainCard title="Phòng thi">
      <Stack spacing={2}>
        <Alert severity="info">
          Phòng thi được quản lý tập trung ở <strong>Quản trị hệ thống &gt; Phòng thi</strong> — nơi đây chỉ để xem, đồng bộ lại khi có thay
          đổi.
        </Alert>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            label="Tìm kiếm (mã / tên)"
            value={search}
            onChange={(e) => {
              setPaginationModel((m) => ({ ...m, page: 0 }));
              setSearch(e.target.value);
            }}
            sx={{ maxWidth: 320 }}
          />
          <TextField
            select
            size="small"
            label="Điểm thi"
            value={organizationFilter}
            onChange={(e) => {
              setPaginationModel((m) => ({ ...m, page: 0 }));
              setOrganizationFilter(e.target.value);
            }}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Tất cả điểm thi</MenuItem>
            {organizations.map((org) => (
              <MenuItem key={org.code} value={org.code}>
                {org.code} - {org.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <DataGrid
          autoHeight
          rows={rows}
          getRowId={(row) => row.code}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Stack>
    </MainCard>
  );
};

export default RoomsPage;
