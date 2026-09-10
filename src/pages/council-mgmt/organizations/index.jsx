import { useEffect, useState, useCallback } from 'react';

// material-ui
import { Alert, Chip, Stack, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';

// ==============================|| ORGANIZATIONS - LIST (READ-ONLY) ||============================== //
// Thêm/sửa/xoá Địa điểm thi đã chuyển hẳn sang kho dữ liệu dùng chung ở Quản trị hệ thống — trang
// này chỉ còn xem, tránh 2 nơi cùng ghi gây sai lệch dữ liệu giữa các DB kỳ thi.

const OrganizationsPage = () => {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getOrganizations({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        search
      });
      setRows(res.data.data.items);
      setRowCount(res.data.data.total);
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được danh sách', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columns = [
    { field: 'code', headerName: 'Mã', width: 120 },
    { field: 'name', headerName: 'Tên', flex: 1, minWidth: 200 },
    { field: 'address', headerName: 'Địa chỉ', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
    }
  ];

  return (
    <MainCard title="Địa điểm thi">
      <Stack spacing={2}>
        <Alert severity="info">
          Địa điểm thi được quản lý tập trung ở <strong>Quản trị hệ thống &gt; Địa điểm thi</strong> — nơi đây chỉ để xem, đồng bộ lại khi
          có thay đổi.
        </Alert>
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

export default OrganizationsPage;
