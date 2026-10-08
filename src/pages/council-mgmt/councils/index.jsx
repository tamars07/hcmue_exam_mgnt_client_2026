import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

// third-party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import councilMgmtService from 'services/council-mgmt.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import useConfirm from 'hooks/useConfirm';

// ==============================|| COUNCILS - LIST ||============================== //

// Khi request dùng responseType: 'blob' (tải file), lỗi server trả JSON vẫn bị axios decode thành
// Blob theo đúng responseType đã khai báo — phải tự đọc lại thành text rồi parse để lấy đúng message
// cụ thể từ backend, không thì chỉ còn mỗi message mặc định chung ở catch.
const extractBlobErrorMessage = async (e) => {
  if (e instanceof Blob) {
    try {
      const text = await e.text();
      return JSON.parse(text)?.message;
    } catch {
      return null;
    }
  }
  return e?.message;
};

// Hiện/nhập ngày theo DD/MM/YYYY (quy ước VN) trong lúc Formik vẫn giữ giá trị gốc dạng ISO
// (YYYY-MM-DD) để Yup.date()/API không đổi — input type="date" của trình duyệt hiện theo locale hệ
// điều hành (có máy ra MM/DD/YYYY), không có cách ép định dạng hiển thị, nên phải tự làm ô nhập chữ
// có dấu "/" tự chèn khi gõ.
const isoToDisplayDate = (iso) => {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
const displayDateToIso = (display) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};
const maskDateInput = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter(Boolean).join('/');
};

const emptyValues = {
  code: '',
  desc: '',
  no_turns: 1,
  start_at: '',
  finish_at: '',
  organization_code: '',
  monitor_id: '',
  is_autostart: false,
  import_testdata_before_time: 60,
  status: true
};

const CouncilsPage = () => {
  const navigate = useNavigate();
  const { withLoading } = useLoadingOverlay();
  const { confirm } = useConfirm();
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [exportingCode, setExportingCode] = useState(null);
  // Phần người dùng gõ tiếp sau prefix "{mã địa điểm thi}." khi tạo mới hội đồng thi.
  const [codeSuffix, setCodeSuffix] = useState('');
  // Chữ hiện trên ô Ngày bắt đầu/Ngày kết thúc (DD/MM/YYYY) — tách khỏi Formik vì Formik giữ ISO.
  const [startDateText, setStartDateText] = useState('');
  const [finishDateText, setFinishDateText] = useState('');

  useEffect(() => {
    councilMgmtService
      .getLookup('organizations')
      .then((res) => setOrganizations(res.data.data))
      .catch(() => {});
  }, []);

  // role_id = 7: điểm trưởng. Chỉ nạp sau khi đã biết địa điểm thi, để lọc đúng theo organization_id.
  const fetchMonitorsForOrg = async (organizationCode) => {
    if (!organizationCode) {
      setMonitors([]);
      return [];
    }
    try {
      const res = await councilMgmtService.getLookup('monitors', { role: 7, organization_code: organizationCode });
      setMonitors(res.data.data);
      return res.data.data;
    } catch {
      setMonitors([]);
      return [];
    }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await councilMgmtService.getCouncils({
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

  const handleOpenCreate = () => {
    setEditing(null);
    setMonitors([]);
    setCodeSuffix('');
    setStartDateText('');
    setFinishDateText('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    fetchMonitorsForOrg(row.organization_code);
    setCodeSuffix('');
    setStartDateText(isoToDisplayDate(row.start_at));
    setFinishDateText(isoToDisplayDate(row.finish_at));
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      await withLoading(async () => {
        if (editing) {
          await councilMgmtService.updateCouncil(editing.code, values);
        } else {
          await councilMgmtService.createCouncil(values);
        }
      }, 'Đang lưu hội đồng thi... Vui lòng chờ');
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

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Xoá hội đồng thi',
      message: `Xoá hội đồng thi "${row.desc || row.code}"? Toàn bộ ca thi, phòng thi đã gán, đề đã nhận của hội đồng này sẽ bị xoá vĩnh viễn (chỉ xoá được khi chưa có thí sinh nào).`,
      confirmText: 'Xoá',
      confirmColor: 'error'
    });
    if (!ok) return;
    try {
      await withLoading(() => councilMgmtService.deleteCouncil(row.code), 'Đang xoá... Vui lòng chờ');
      openSnackbar({ open: true, message: 'Đã xoá', variant: 'alert', alert: { color: 'success' } });
      fetchRows();
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Xoá thất bại', variant: 'alert', alert: { color: 'error' } });
    }
  };

  const handleExportMonitorAccounts = async (row) => {
    setExportingCode(row.code);
    try {
      const res = await withLoading(
        () => councilMgmtService.exportCouncilMonitorAccounts(row.code),
        'Đang tải tài khoản cán bộ coi thi... Vui lòng chờ'
      );
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.code}-Tai-khoan-giam-thi.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const message = await extractBlobErrorMessage(e);
      openSnackbar({
        open: true,
        message: message || 'Tải tài khoản cán bộ coi thi thất bại',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setExportingCode(null);
    }
  };

  const columns = [
    { field: 'code', headerName: 'Mã HĐ thi', width: 140 },
    { field: 'desc', headerName: 'Diễn giải', flex: 1, minWidth: 160 },
    { field: 'organization_code', headerName: 'Điểm thi', width: 120 },
    { field: 'no_turns', headerName: 'Số ca thi', width: 100, type: 'number' },
    { field: 'start_at', headerName: 'Ngày BĐ', width: 120 },
    { field: 'finish_at', headerName: 'Ngày KT', width: 120 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 130,
      renderCell: (params) => <Chip label={params.value ? 'Sử dụng' : 'Ẩn'} color={params.value ? 'success' : 'default'} size="small" />
    },
    {
      field: 'actions',
      headerName: '',
      width: 400,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Xem/chỉnh ngày giờ, gán phòng thi cho từng ca thi của hội đồng này">
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<UnorderedListOutlined />}
              onClick={() => navigate(`/council-mgmt/councils/${params.row.code}/turns`)}
            >
              Quản trị ca thi
            </Button>
          </Tooltip>
          <Tooltip title="Xuất phiếu tài khoản giám thị + điểm trưởng (toàn hội đồng)">
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<DownloadOutlined />}
                disabled={exportingCode === params.row.code}
                onClick={() => handleExportMonitorAccounts(params.row)}
                sx={{ bgcolor: '#107C41', '&:hover': { bgcolor: '#0b5c30' } }}
              >
                Xuất phiếu
              </Button>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="Sửa">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xoá">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <MainCard
      title="Hội đồng thi"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm hội đồng thi
        </Button>
      }
    >
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Tìm kiếm (mã / diễn giải)"
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Formik
          enableReinitialize
          initialValues={editing || emptyValues}
          validationSchema={Yup.object().shape({
            code: Yup.string().max(50).required('Bắt buộc nhập mã'),
            no_turns: Yup.number().min(1).max(20).required('Bắt buộc nhập số ca thi'),
            start_at: Yup.date().typeError('Ngày bắt đầu chưa hợp lệ (định dạng DD/MM/YYYY)').required('Bắt buộc nhập ngày bắt đầu'),
            finish_at: Yup.date()
              .typeError('Ngày kết thúc chưa hợp lệ (định dạng DD/MM/YYYY)')
              .min(Yup.ref('start_at'), 'Phải sau ngày bắt đầu')
              .required('Bắt buộc nhập ngày kết thúc'),
            organization_code: Yup.string().required('Bắt buộc chọn điểm thi'),
            monitor_id: Yup.number().required('Bắt buộc chọn điểm trưởng')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleBlur, handleChange, handleSubmit: submitForm, isSubmitting, setFieldValue }) => (
            <form noValidate onSubmit={submitForm}>
              <DialogTitle>{editing ? 'Sửa hội đồng thi' : 'Thêm hội đồng thi'}</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    select
                    label="Điểm thi"
                    name="organization_code"
                    value={values.organization_code}
                    onChange={async (e) => {
                      const orgCode = e.target.value;
                      setFieldValue('organization_code', orgCode);
                      if (!editing) {
                        setFieldValue('code', orgCode ? `${orgCode}.${codeSuffix}` : codeSuffix);
                      }
                      const list = await fetchMonitorsForOrg(orgCode);
                      setFieldValue('monitor_id', list.length > 0 ? list[0].id : '');
                    }}
                    onBlur={handleBlur}
                    disabled={!!editing}
                    error={Boolean(touched.organization_code && errors.organization_code)}
                    helperText={touched.organization_code && errors.organization_code}
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org.code} value={org.code}>
                        {org.code} - {org.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  {editing ? (
                    <TextField fullWidth label="Mã HĐ thi" name="code" value={values.code} disabled />
                  ) : (
                    <TextField
                      fullWidth
                      label="Mã HĐ thi"
                      name="codeSuffix"
                      value={codeSuffix}
                      onChange={(e) => {
                        const suffix = e.target.value;
                        setCodeSuffix(suffix);
                        setFieldValue('code', values.organization_code ? `${values.organization_code}.${suffix}` : suffix);
                      }}
                      onBlur={handleBlur}
                      disabled={!values.organization_code}
                      InputProps={{
                        startAdornment: values.organization_code && (
                          <InputAdornment position="start">{values.organization_code}.</InputAdornment>
                        )
                      }}
                      error={Boolean(touched.code && errors.code)}
                      helperText={
                        (touched.code && errors.code) || (!values.organization_code && 'Chọn điểm thi trước để xác định tiền tố mã')
                      }
                    />
                  )}
                  <TextField
                    fullWidth
                    label="Diễn giải"
                    name="desc"
                    value={values.desc || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <TextField
                    fullWidth
                    select
                    label="Điểm trưởng"
                    name="monitor_id"
                    value={values.monitor_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!values.organization_code}
                    error={Boolean(touched.monitor_id && errors.monitor_id)}
                    helperText={
                      (touched.monitor_id && errors.monitor_id) ||
                      (values.organization_code && monitors.length === 0 && 'Điểm thi này chưa có điểm trưởng nào') ||
                      (!values.organization_code && 'Chọn điểm thi trước để tự động chọn điểm trưởng')
                    }
                  >
                    {monitors.map((m) => (
                      <MenuItem key={m.code} value={m.id}>
                        {m.name} ({m.code})
                      </MenuItem>
                    ))}
                  </TextField>
                  {!editing && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Số ca thi"
                      name="no_turns"
                      value={values.no_turns}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.no_turns && errors.no_turns)}
                      helperText={touched.no_turns && errors.no_turns}
                    />
                  )}
                  <TextField
                    fullWidth
                    label="Ngày bắt đầu"
                    name="start_at_display"
                    placeholder="DD/MM/YYYY"
                    value={startDateText}
                    onChange={(e) => {
                      const masked = maskDateInput(e.target.value);
                      setStartDateText(masked);
                      setFieldValue('start_at', displayDateToIso(masked));
                    }}
                    onBlur={handleBlur}
                    error={Boolean(touched.start_at && errors.start_at)}
                    helperText={
                      (touched.start_at && errors.start_at) ||
                      'Khung "đang diễn ra" của cả hội đồng thi — giám thị chỉ thấy hội đồng này trong danh sách chọn lúc đăng nhập nếu thời điểm hiện tại nằm trong khung Ngày bắt đầu → Ngày kết thúc. Đặt rộng đủ bao trùm mọi ca thi con, kể cả ca thêm sau.'
                    }
                  />
                  <TextField
                    fullWidth
                    label="Ngày kết thúc"
                    name="finish_at_display"
                    placeholder="DD/MM/YYYY"
                    value={finishDateText}
                    onChange={(e) => {
                      const masked = maskDateInput(e.target.value);
                      setFinishDateText(masked);
                      setFieldValue('finish_at', displayDateToIso(masked));
                    }}
                    onBlur={handleBlur}
                    error={Boolean(touched.finish_at && errors.finish_at)}
                    helperText={touched.finish_at && errors.finish_at}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Cho phép nhập đề trước giờ thi (phút)"
                    name="import_testdata_before_time"
                    value={values.import_testdata_before_time}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <Stack spacing={0.5}>
                    <FormControlLabel
                      control={<Switch checked={!!values.is_autostart} onChange={(e) => setFieldValue('is_autostart', e.target.checked)} />}
                      label="Tự động kích hoạt phòng thi"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Bật: mọi phòng thi của hội đồng này được coi như đã kích hoạt ngay khi ca thi bắt đầu — không cần bấm “Kích hoạt
                      phòng thi” cho từng phòng nữa. Tắt (mặc định): vẫn phải kích hoạt thủ công từng phòng sau khi bắt đầu ca thi.
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={<Switch checked={!!values.status} onChange={(e) => setFieldValue('status', e.target.checked)} />}
                    label="Sử dụng"
                  />
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
    </MainCard>
  );
};

export default CouncilsPage;
