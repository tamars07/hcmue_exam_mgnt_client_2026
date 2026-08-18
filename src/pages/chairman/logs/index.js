import { useEffect, useState } from 'react';

// material-ui
import {
  Autocomplete,
  Chip,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useAuth from 'hooks/useAuth';
import { isCouncilRunningToday, formatTurnLabel } from 'utils/council-schedule';

// ==============================|| ĐIỂM TRƯỞNG - NHẬT KÝ ||============================== //

const ChairmanLogsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCode, setTurnCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');

  const [tab, setTab] = useState(0);

  const [importLogs, setImportLogs] = useState([]);
  const [monitorLogs, setMonitorLogs] = useState([]);

  const [examinees, setExaminees] = useState([]);
  const [examineeAccount, setExamineeAccount] = useState('');
  const [examineeActivity, setExamineeActivity] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        // Điểm trưởng: chỉ hiện hội đồng thi đang diễn ra hôm nay. Admin: hiện tất cả hội đồng thi.
        const list = isAdmin ? res.data.data || [] : (res.data.data || []).filter(isCouncilRunningToday);
        setCouncils(list);
        if (list.length > 0) setCouncilCode(list[0].code);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    setTurnCode('');
    setSearchQuery('');
    setSearchResults([]);
    if (!councilCode) {
      setTurns([]);
      return;
    }
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
  }, [councilCode]);

  useEffect(() => {
    if (!turnCode) {
      setRooms([]);
      return;
    }
    chairmanService
      .getCouncilTurnRooms(turnCode)
      .then((res) =>
        setRooms([...res.data.data].sort((a, b) => (a.room_name || '').localeCompare(b.room_name || '', 'vi', { numeric: true })))
      )
      .catch(() => setRooms([]));
    setRoomCode('');
  }, [turnCode]);

  useEffect(() => {
    if (!turnCode) {
      setImportLogs([]);
      return;
    }
    chairmanService
      .getTestDataImportLogs(turnCode)
      .then((res) => setImportLogs(res.data.data))
      .catch((e) => openSnackbar({ open: true, message: e?.message || 'Không tải được nhật ký nạp đề', variant: 'alert', alert: { color: 'error' } }));
  }, [turnCode]);

  useEffect(() => {
    if (!turnCode) {
      setMonitorLogs([]);
      return;
    }
    chairmanService
      .getMonitorActivityLogs(turnCode, roomCode)
      .then((res) => setMonitorLogs(res.data.data))
      .catch((e) => openSnackbar({ open: true, message: e?.message || 'Không tải được nhật ký cán bộ coi thi', variant: 'alert', alert: { color: 'error' } }));
  }, [turnCode, roomCode]);

  useEffect(() => {
    if (!turnCode || !roomCode) {
      setExaminees([]);
      return;
    }
    chairmanService
      .getExamineesByRoom(turnCode, roomCode)
      .then((res) => setExaminees(res.data.data.examinees))
      .catch(() => setExaminees([]));
    setExamineeAccount('');
    setExamineeActivity(null);
  }, [turnCode, roomCode]);

  useEffect(() => {
    if (!examineeAccount) {
      setExamineeActivity(null);
      return;
    }
    chairmanService
      .getExamineeActivityLogs(examineeAccount)
      .then((res) => setExamineeActivity(res.data.data))
      .catch(() => setExamineeActivity(null));
  }, [examineeAccount]);

  // Tìm thí sinh theo tài khoản/CCCD-MSSV/họ tên khi không nhớ ca thi/phòng thi — chỉ cần hội đồng thi.
  useEffect(() => {
    if (!councilCode || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      chairmanService
        .searchExaminees(councilCode, searchQuery.trim())
        .then((res) => setSearchResults(res.data.data))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [councilCode, searchQuery]);

  return (
    <MainCard title="Nhật ký kì thi">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          <TextField
            select
            size="small"
            label="Hội đồng thi"
            value={councilCode}
            onChange={(e) => setCouncilCode(e.target.value)}
            sx={{ minWidth: 240 }}
            helperText={councils.length === 0 ? (isAdmin ? 'Chưa có hội đồng thi nào' : 'Không có hội đồng thi nào diễn ra hôm nay') : ''}
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
            sx={{ minWidth: 200 }}
          >
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {formatTurnLabel(t)}
              </MenuItem>
            ))}
          </TextField>
          {tab !== 0 && (
            <TextField
              select
              size="small"
              label="Phòng thi"
              value={roomCode}
              disabled={!turnCode}
              onChange={(e) => setRoomCode(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Tất cả phòng thi</MenuItem>
              {rooms.map((r) => (
                <MenuItem key={r.room_code} value={r.room_code}>
                  {r.room_name || r.room_code}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>

        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Nạp đề thi" />
          <Tab label="Cán bộ coi thi" />
          <Tab label="Thí sinh" />
        </Tabs>

        {tab === 0 &&
          (!turnCode ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Chọn ca thi để xem nhật ký nạp đề thi.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Môn thi</TableCell>
                    <TableCell>Số đề đã nạp</TableCell>
                    <TableCell>Đã sử dụng</TableCell>
                    <TableCell>Nạp lần đầu</TableCell>
                    <TableCell>Nạp lần cuối</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importLogs.map((row) => (
                    <TableRow key={row.subject_id}>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.total_mixes}</TableCell>
                      <TableCell>{row.used_mixes}</TableCell>
                      <TableCell>{row.first_imported_at}</TableCell>
                      <TableCell>{row.last_imported_at}</TableCell>
                    </TableRow>
                  ))}
                  {importLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary" align="center">
                          Ca thi này chưa được nạp đề thi.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ))}

        {tab === 1 &&
          (!turnCode ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Chọn ca thi để xem nhật ký cán bộ coi thi.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Tài khoản</TableCell>
                    <TableCell>Phòng thi</TableCell>
                    <TableCell>Hành động</TableCell>
                    <TableCell>Lý do / Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monitorLogs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.log_time}</TableCell>
                      <TableCell>{row.username}</TableCell>
                      <TableCell>{row.room_code}</TableCell>
                      <TableCell>
                        <Chip label={row.action} size="small" />
                      </TableCell>
                      <TableCell>{row.message || (typeof row.detail === 'string' ? row.detail : '')}</TableCell>
                    </TableRow>
                  ))}
                  {monitorLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary" align="center">
                          Chưa có hoạt động nào của cán bộ coi thi.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ))}

        {tab === 2 &&
          (!councilCode ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Chọn hội đồng thi để tìm thí sinh.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
                <Autocomplete
                  sx={{ minWidth: 340 }}
                  options={searchResults}
                  loading={searching}
                  value={null}
                  inputValue={searchQuery}
                  onInputChange={(e, value) => setSearchQuery(value)}
                  getOptionLabel={(opt) => (opt ? `${opt.code} - ${opt.fullname} (${opt.username})` : '')}
                  isOptionEqualToValue={(opt, val) => opt.username === val.username}
                  noOptionsText={searchQuery.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không tìm thấy thí sinh'}
                  onChange={(e, value) => {
                    if (value) {
                      setExamineeAccount(value.username);
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label="Tìm thí sinh (tài khoản / CCCD-MSSV / họ tên)" />
                  )}
                />
                <TextField
                  select
                  size="small"
                  label="Hoặc chọn theo phòng thi"
                  value={examineeAccount}
                  disabled={!roomCode}
                  onChange={(e) => setExamineeAccount(e.target.value)}
                  sx={{ minWidth: 300 }}
                  helperText={!roomCode ? 'Chọn ca thi + phòng thi ở trên để lọc theo phòng' : ''}
                >
                  {examinees.map((ex) => (
                    <MenuItem key={ex.username} value={ex.username}>
                      {ex.code} - {ex.fullname}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              {examineeActivity && (
                <>
                  <Typography variant="subtitle1">Dòng thời gian</Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Thời gian</TableCell>
                          <TableCell>Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {examineeActivity.timeline.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.log_time}</TableCell>
                            <TableCell>
                              <Chip label={row.action} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                        {examineeActivity.timeline.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2}>
                              <Typography color="text.secondary" align="center">
                                Chưa có hoạt động nào.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle1">Tiến độ trả lời từng câu</Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Câu</TableCell>
                          <TableCell>Thời điểm trả lời</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {examineeActivity.progress.map((row) => (
                          <TableRow key={row.question_id}>
                            <TableCell>{row.question_number}</TableCell>
                            <TableCell>{row.submitted_at || '—'}</TableCell>
                          </TableRow>
                        ))}
                        {examineeActivity.progress.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2}>
                              <Typography color="text.secondary" align="center">
                                Chưa trả lời câu nào.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Stack>
          ))}
      </Stack>
    </MainCard>
  );
};

export default ChairmanLogsPage;
