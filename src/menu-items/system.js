// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DatabaseOutlined, SettingOutlined, FileSearchOutlined } from '@ant-design/icons';

// icons
const icons = { DatabaseOutlined, SettingOutlined, FileSearchOutlined };

// ==============================|| MENU ITEMS - SUPER ADMIN (SYSTEM) ||============================== //
// Menu riêng cho khu vực /system — không đi qua getMenuItems()/lọc theo role như menu-items/index.js
// (dùng cho JWTContext của admin hội đồng thi), vì Super Admin dùng guard/đăng nhập hoàn toàn tách
// biệt (xem layout/System, hooks/useSuperAdmin).

const system = {
  id: 'group-system',
  title: <FormattedMessage id="system" defaultMessage="Quản trị hệ thống" />,
  type: 'group',
  children: [
    {
      id: 'system-exam-databases',
      title: <FormattedMessage id="system-exam-databases" defaultMessage="Cấu hình database" />,
      type: 'item',
      url: '/system/exam-databases',
      icon: icons.DatabaseOutlined
    },
    {
      id: 'system-exam-config',
      title: <FormattedMessage id="system-exam-config" defaultMessage="Cấu hình Kì thi" />,
      type: 'item',
      url: '/system/exam-config',
      icon: icons.SettingOutlined
    },
    {
      id: 'system-activity-logs',
      title: <FormattedMessage id="system-activity-logs" defaultMessage="Nhật ký Hệ thống" />,
      type: 'item',
      url: '/system/activity-logs',
      icon: icons.FileSearchOutlined
    }
  ]
};

export default system;
