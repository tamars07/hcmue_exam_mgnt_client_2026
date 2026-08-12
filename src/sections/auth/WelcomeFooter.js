import { Grid, Button, Stack, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
// import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// project import
import MainCard from 'components/MainCard';
import { 
  // ThemeMode, 
  ThemeDirection 
} from 'config';
import useAuth from 'hooks/useAuth';


const WelcomeFooter = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
      navigate(`/login`, {
        state: {
          from: ''
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainCard
      border={false}
      sx={{
        borderRadius: 0, // Đảm bảo không bị bo cong
        background:
          theme.direction === ThemeDirection.RTL
            ? `linear-gradient(60.38deg, ${theme.palette.primary.lighter} 114%, ${theme.palette.primary.light} 34.42%, ${theme.palette.primary.main} 60.95%, ${theme.palette.primary.dark} 84.83%, ${theme.palette.primary.darker} 104.37%)`
            : `linear-gradient(250.38deg, ${theme.palette.primary.lighter} 2.39%, ${theme.palette.primary.light} 34.42%, ${theme.palette.primary.main} 60.95%, ${theme.palette.primary.dark} 84.83%, ${theme.palette.primary.darker} 104.37%)`
      }}
    >
      <Grid container>
        <Grid item md={7} sm={6} xs={12}>
          <Stack spacing={3} sx={{ padding: 3.4 }}>
            <Box>
              <Button
                variant="outlined"
                color="secondary"
                sx={{
                  color: theme.palette.background.paper,
                  borderColor: theme.palette.background.paper,
                  padding: '10px 20px',
                  '&:hover': {
                    color: 'background.paper',
                    borderColor: theme.palette.background.paper,
                    // bgcolor: theme.palette.mode === ThemeMode.DARK ? 'primary.darker' : 'primary.main',
                    bgcolor: 'primary.darker',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)', // Tạo hiệu ứng nổi lên
                    transform: 'scale(1.1)', // Phóng to nhẹ nút khi hover
                  },
                  transition: 'all 0.3s ease', // Thêm hiệu ứng chuyển động mượt mà
                }}
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
};

export default WelcomeFooter;
