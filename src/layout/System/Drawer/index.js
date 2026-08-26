import PropTypes from 'prop-types';
import { useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// project import
import DrawerHeader from 'layout/Dashboard/Drawer/DrawerHeader';
import MiniDrawerStyled from 'layout/Dashboard/Drawer/MiniDrawerStyled';
import DrawerContent from './DrawerContent';

import { DRAWER_WIDTH } from 'config';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| SYSTEM (SUPER ADMIN) - DRAWER ||============================== //
// Mirror của layout/Dashboard/Drawer (mở/thu gọn) nhưng dùng menu tĩnh riêng cho khu vực Super Admin
// — tái dùng DrawerHeader/MiniDrawerStyled sẵn có (thuần hiển thị), chỉ thay DrawerContent.

const SystemDrawer = ({ window }) => {
  const theme = useTheme();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'));

  const container = window !== undefined ? () => window().document.body : undefined;

  const drawerContent = useMemo(() => <DrawerContent />, []);
  const drawerHeader = useMemo(() => <DrawerHeader open={drawerOpen} />, [drawerOpen]);

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, zIndex: 1200 }} aria-label="system-mailbox-folders">
      {!matchDownMD ? (
        <MiniDrawerStyled variant="permanent" open={drawerOpen}>
          {drawerHeader}
          {drawerContent}
        </MiniDrawerStyled>
      ) : (
        <Drawer
          container={container}
          variant="temporary"
          open={drawerOpen}
          onClose={() => handlerDrawerOpen(!drawerOpen)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: 'none',
              boxShadow: 'inherit'
            }
          }}
        >
          {drawerHeader}
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

SystemDrawer.propTypes = {
  window: PropTypes.object
};

export default SystemDrawer;
