import { useEffect, useState } from 'react';

// material-ui
import { Container, Stack, Typography, useMediaQuery } from '@mui/material';

// project import
import axios from 'utils/axios';

// ==============================|| FOOTER - AUTHENTICATION ||============================== //
// Số hiệu phiên bản + đơn vị nắm bản quyền lấy chung 1 request từ backend (GET /api/system-info,
// khai báo duy nhất ở config('app.version')/config('app.copyright_owner')) thay vì hardcode ở đây
// — để đồng bộ với các phân hệ frontend khác không cần sửa nhiều nơi. Cache vào localStorage 24h —
// 2 thông tin này chỉ đổi khi backend deploy bản mới, không cần gọi lại API mỗi lần tải lại trang.
const SYSTEM_INFO_CACHE_KEY = 'system_info';
const SYSTEM_INFO_CACHE_TTL = 24 * 60 * 60 * 1000;

const readSystemInfoCache = () => {
  try {
    return JSON.parse(localStorage.getItem(SYSTEM_INFO_CACHE_KEY));
  } catch (e) {
    return null;
  }
};

const AuthFooter = () => {
  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [systemInfo, setSystemInfo] = useState(() => readSystemInfoCache()?.value || {});

  useEffect(() => {
    const cached = readSystemInfoCache();
    if (cached && Date.now() - cached.fetchedAt < SYSTEM_INFO_CACHE_TTL) {
      return;
    }

    axios
      .get('api/system-info')
      .then((res) => {
        const value = res.data?.data || {};
        setSystemInfo(value);
        try {
          localStorage.setItem(SYSTEM_INFO_CACHE_KEY, JSON.stringify({ value, fetchedAt: Date.now() }));
        } catch (e) {
          // localStorage đầy/bị chặn — bỏ qua, lần tải trang sau sẽ gọi lại API bình thường
        }
      })
      .catch(() => {});
  }, []);

  const { version, copyright_owner: copyrightOwner } = systemInfo;

  return (
    <Container maxWidth="xl">
      <Stack
        direction={matchDownSM ? 'column' : 'row'}
        justifyContent={matchDownSM ? 'center' : 'space-between'}
        spacing={2}
        textAlign={matchDownSM ? 'center' : 'inherit'}
      >
        <Typography variant="subtitle2" color="secondary" component="span">
          Bản quyền thuộc{' '}
          <Typography component="span" variant="subtitle2">
            {copyrightOwner || 'HCMUE'} &#169;{version ? ` ${version}` : ''}
          </Typography>
        </Typography>

        <Stack direction={matchDownSM ? 'column' : 'row'} spacing={matchDownSM ? 1 : 3} textAlign={matchDownSM ? 'center' : 'inherit'}>
          {/*<Typography
            variant="subtitle2"
            color="secondary"
            component={Link}
            href="https://hcmue.edu.vn/vi/"
            target="_blank"
            underline="hover"
          >
            Trường Đại học Sư phạm Thành phố Hồ Chí Minh &#169;
          </Typography>*/}
        </Stack>
      </Stack>
    </Container>
  );
};

export default AuthFooter;
