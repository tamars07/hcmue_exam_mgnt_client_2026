import { useEffect, useState } from 'react';

// material-ui
import {
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

// ==============================|| ĐIỂM TRƯỞNG - NHẬT KÝ ||============================== //

const ChairmanLogsPage = () => {
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

  useEffect(() => {
    chairmanService
      .getMyCouncils()
      .then((res) => {
        const list = res.data.data;
        setCouncils(list);
        if (list.length > 0) setCouncilCode(list[0].code);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!councilCode) return;
    chairmanService
      .getCouncilTurns(councilCode)
      .then((res) => setTurns(res.data.data))
      .catch(() => setTurns([]));
    setTurnCode('');
  }, [councilCode]);

  useEffect(() => {
    if (!turnCode) {
      setRooms([]);
      return;
    }
    chairmanService
      .getCouncilTurnRooms(turnCode)
      .then((res) => setRooms(res.data.data))
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

  return (
    <MainCard title="Nhật ký">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2}>
          {councils.length > 1 && (
            <TextField select size="small" label="Hội đồng thi" value={councilCode} onChange={(e) => setCouncilCode(e.target.value)} sx={{ minWidth: 240 }}>
              {councils.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.desc || c.code}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField select size="small" label="Ca thi" value={turnCode} onChange={(e) => setTurnCode(e.target.value)} sx={{ minWidth: 200 }}>
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          {tab !== 0 && (
            <TextField select size="small" label="Phòng thi" value={roomCode} disabled={!turnCode} onChange={(e) => setRoomCode(e.target.value)} sx={{ minWidth: 200 }}>
              <MenuItem value="">Tất cả phòng thi</MenuItem>
              {rooms.map((r) => (
                <MenuItem key={r.room_code} value={r.room_code}>
                  {r.room_code}
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

        {!turnCode ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Chọn ca thi để xem nhật ký.
          </Typography>
        ) : (
          <>
            {tab === 0 && (
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
            )}

            {tab === 1 && (
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
            )}

            {tab === 2 && (
              <Stack spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Thí sinh"
                  value={examineeAccount}
                  disabled={!roomCode}
                  onChange={(e) => setExamineeAccount(e.target.value)}
                  sx={{ maxWidth: 320 }}
                  helperText={!roomCode ? 'Chọn phòng thi ở trên để lọc danh sách thí sinh' : ''}
                >
                  {examinees.map((ex) => (
                    <MenuItem key={ex.username} value={ex.username}>
                      {ex.code} - {ex.fullname}
                    </MenuItem>
                  ))}
                </TextField>

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
            )}
          </>
        )}
      </Stack>
    </MainCard>
  );
};

export default ChairmanLogsPage;
