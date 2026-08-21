import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import { Chip, Stack, Tooltip } from '@mui/material';

// project import
import axios from 'utils/axios';

// assets
import { DatabaseOutlined, SwapOutlined } from '@ant-design/icons';

// ==============================|| HEADER CONTENT - ACTIVE DATABASE INFO ||============================== //

const ActiveDatabaseInfo = () => {
  const navigate = useNavigate();
  const [activeDb, setActiveDb] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/auth/active-database')
      .then((res) => {
        if (mounted) setActiveDb(res.data?.data || null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!activeDb) return null;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mr: 1 }}>
      <Tooltip title={`Cơ sở dữ liệu kỳ thi đang sử dụng: ${activeDb.label}`}>
        <Chip
          icon={<DatabaseOutlined />}
          label={activeDb.label}
          color="info"
          variant="light"
          size="small"
          sx={{ maxWidth: { xs: 120, sm: 220 } }}
        />
      </Tooltip>
      <Tooltip title="Chuyển sang đăng nhập Super Admin để cấu hình lại cơ sở dữ liệu">
        <Chip
          icon={<SwapOutlined />}
          label="Đổi CSDL"
          size="small"
          variant="outlined"
          clickable
          onClick={() => navigate('/system/login')}
        />
      </Tooltip>
    </Stack>
  );
};

export default ActiveDatabaseInfo;
