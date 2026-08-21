// material-ui
import { Box, useMediaQuery } from '@mui/material';

// project import
import Search from './Search';
import UserInfo from './UserInfo';
import LogoutButton from './LogoutButton';
import Notification from './Notification';
import FullScreen from './FullScreen';
import MobileSection from './MobileSection';
import ActiveDatabaseInfo from './ActiveDatabaseInfo';

import useConfig from 'hooks/useConfig';
import DrawerHeader from 'layout/Dashboard/Drawer/DrawerHeader';

import { MenuOrientation } from 'config';

// ==============================|| HEADER - CONTENT ||============================== //

const HeaderContent = () => {
  const { menuOrientation } = useConfig();

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <>
      {menuOrientation === MenuOrientation.HORIZONTAL && !downLG && <DrawerHeader open={true} />}
      {!downLG && <Search />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      {!downLG && <ActiveDatabaseInfo />}
      <Notification />
      {!downLG && <FullScreen />}
      {downLG && <MobileSection />}
      <UserInfo />
      <LogoutButton />
    </>
  );
};

export default HeaderContent;
