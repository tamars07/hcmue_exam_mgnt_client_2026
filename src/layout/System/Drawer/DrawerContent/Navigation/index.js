import { useState } from 'react';

// material-ui
import { Box } from '@mui/material';

// project import
import NavGroup from 'layout/Dashboard/Drawer/DrawerContent/Navigation/NavGroup';
import systemMenu from 'menu-items/system';

// ==============================|| SYSTEM (SUPER ADMIN) - DRAWER NAVIGATION ||============================== //
// Tái dùng NavGroup/NavItem của khu vực council-mgmt (thuần hiển thị, không phụ thuộc JWTContext) —
// chỉ khác ở nguồn menu: 1 group tĩnh (menu-items/system.js) thay vì getMenuItems(user.roles).

const SystemNavigation = () => {
  const [selectedItems, setSelectedItems] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);

  return (
    <Box sx={{ pt: 2 }}>
      <NavGroup
        item={systemMenu}
        remItems={[]}
        setSelectedItems={setSelectedItems}
        setSelectedLevel={setSelectedLevel}
        selectedLevel={selectedLevel}
        selectedItems={selectedItems}
      />
    </Box>
  );
};

export default SystemNavigation;
