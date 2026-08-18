import { useEffect, useState } from 'react';

// material-ui
import { Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import { openSnackbar } from 'api/snackbar';
import chairmanService from 'services/chairman.service';
import useLoadingOverlay from 'hooks/useLoadingOverlay';
import { isCouncilRunningToday, formatTurnLabel } from 'utils/council-schedule';
import { DonutChart, YearBarChart } from './Charts';

const STATUS_LABELS = {
  'CHƯA ĐĂNG NHẬP': 'Chưa đăng nhập',
  'CHỜ THI': 'Chờ thi',
  'ĐANG THI': 'Đang thi',
  'ĐÃ NỘP BÀI': 'Nộp bài',
  'DỰ PHÒNG': 'Dự phòng'
};
const STATUS_COLORS = ['#9e9e9e', '#faad14', '#52c41a', '#1677ff', '#fa8c16'];
const GENDER_COLORS = ['#1677ff', '#eb2f96', '#9e9e9e'];

// ==============================|| GIÁM SÁT KÌ THI - TỔNG QUAN ||============================== //

const ChairmanDashboardPage = () => {
  const { withLoading } = useLoadingOverlay();

  const [councils, setCouncils] = useState([]);
  const [councilCode, setCouncilCode] = useState('');
  const [turns, setTurns] = useState([]);
  const [turnCode, setTurnCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomCode, setRoomCode] = useState('');

  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(false);

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
    setRooms([]);
    setRoomCode('');
    setStats(null);
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
    setRoomCode('');
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
  }, [turnCode]);

  const handleViewStats = async () => {
    if (!councilCode) return;
    setFetching(true);
    try {
      await withLoading(async () => {
        const res = await chairmanService.getDashboardStats(councilCode, turnCode, roomCode);
        setStats(res.data.data);
      }, 'Đang tải thống kê...');
    } catch (e) {
      openSnackbar({ open: true, message: e?.message || 'Không tải được thống kê', variant: 'alert', alert: { color: 'error' } });
    } finally {
      setFetching(false);
    }
  };

  const statusBreakdown = stats?.status_breakdown || [];

  const genderBreakdown = stats?.gender_breakdown || [];
  const genderLabels = genderBreakdown.map((g) => g.gender);
  const genderSeries = genderBreakdown.map((g) => g.count);

  const yearBreakdown = stats?.birth_year_breakdown || [];
  const yearCategories = yearBreakdown.map((y) => String(y.year));
  const yearSeries = yearBreakdown.map((y) => y.count);

  return (
    <MainCard title="Tổng quan">
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={2} alignItems="flex-start">
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
            <MenuItem value="">Tất cả ca thi</MenuItem>
            {turns.map((t) => (
              <MenuItem key={t.code} value={t.code}>
                {formatTurnLabel(t)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Phòng thi"
            value={roomCode}
            disabled={!turnCode}
            onChange={(e) => setRoomCode(e.target.value)}
            sx={{ minWidth: 200 }}
            helperText={!turnCode ? 'Chọn ca thi cụ thể để lọc theo phòng' : ''}
          >
            <MenuItem value="">Tất cả phòng thi</MenuItem>
            {rooms.map((r) => (
              <MenuItem key={r.room_code} value={r.room_code}>
                {r.room_name || r.room_code}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={!councilCode || fetching} onClick={handleViewStats} sx={{ height: 40 }}>
            Xem thống kê
          </Button>
        </Stack>

        {!stats ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            Chọn hội đồng thi (và ca thi/phòng thi nếu muốn) rồi bấm &quot;Xem thống kê&quot;.
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <MainCard content={false} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số thí sinh có tên theo danh sách (không tính dự phòng)
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {stats.total_official}
                  </Typography>
                </MainCard>
              </Grid>
              <Grid item xs={12} sm={6}>
                <MainCard content={false} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng số thí sinh (kể cả dự phòng)
                  </Typography>
                  <Typography variant="h2" sx={{ mt: 0.5 }}>
                    {stats.total_all}
                  </Typography>
                </MainCard>
              </Grid>
            </Grid>

            <MainCard title="Trạng thái thí sinh">
              <Grid container spacing={2}>
                {statusBreakdown.map((s, idx) => (
                  <Grid item xs={6} sm={4} md={2.4} key={s.status}>
                    <Stack
                      alignItems="center"
                      spacing={0.5}
                      sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                    >
                      <Typography variant="body2" color="text.secondary" align="center">
                        {STATUS_LABELS[s.status] || s.status}
                      </Typography>
                      <Typography variant="h3" sx={{ color: STATUS_COLORS[idx % STATUS_COLORS.length] }}>
                        {s.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.percent}%
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </MainCard>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <MainCard title="Giới tính (theo CCCD 12 số)">
                  <DonutChart labels={genderLabels} series={genderSeries} colors={GENDER_COLORS} totalLabel="Chính thức" />
                </MainCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <MainCard title="Năm sinh">
                  <YearBarChart categories={yearCategories} data={yearSeries} color={STATUS_COLORS[3]} />
                </MainCard>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </MainCard>
  );
};

export default ChairmanDashboardPage;
