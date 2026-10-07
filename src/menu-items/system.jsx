// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
  DatabaseOutlined,
  IdcardOutlined,
  SettingOutlined,
  FileSearchOutlined,
  LoginOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  BookOutlined
} from '@ant-design/icons';

// icons
const icons = {
  DatabaseOutlined,
  IdcardOutlined,
  SettingOutlined,
  FileSearchOutlined,
  LoginOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  BookOutlined
};

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
      url: '/acp/exam-databases',
      icon: icons.DatabaseOutlined
    },
    {
      id: 'system-admin-accounts',
      title: <FormattedMessage id="system-admin-accounts" defaultMessage="Tài khoản ADMIN" />,
      type: 'item',
      url: '/acp/admin-accounts',
      icon: icons.IdcardOutlined
    },
    {
      id: 'system-exam-config',
      title: <FormattedMessage id="system-exam-config" defaultMessage="Cấu hình Kì thi" />,
      type: 'item',
      url: '/acp/exam-config',
      icon: icons.SettingOutlined
    },
    {
      id: 'system-organizations',
      title: <FormattedMessage id="system-organizations" defaultMessage="Địa điểm thi" />,
      type: 'item',
      url: '/acp/organizations',
      icon: icons.EnvironmentOutlined
    },
    {
      id: 'system-rooms',
      title: <FormattedMessage id="system-rooms" defaultMessage="Phòng thi" />,
      type: 'item',
      url: '/acp/rooms',
      icon: icons.HomeOutlined
    },
    {
      id: 'system-monitors',
      title: <FormattedMessage id="system-monitors" defaultMessage="Cán bộ" />,
      type: 'item',
      url: '/acp/monitors',
      icon: icons.TeamOutlined
    },
    {
      id: 'system-subjects',
      title: <FormattedMessage id="system-subjects" defaultMessage="Môn thi" />,
      type: 'item',
      url: '/acp/subjects',
      icon: icons.BookOutlined
    },
    {
      id: 'system-activity-logs',
      title: <FormattedMessage id="system-activity-logs" defaultMessage="Nhật ký Hệ thống" />,
      type: 'item',
      url: '/acp/activity-logs',
      icon: icons.FileSearchOutlined
    }
  ]
};

// Không có title -> NavGroup chỉ vẽ 1 đường Divider phân tách, không hiện tiêu đề nhóm — đặt cuối
// menu trái để tách hẳn khỏi các mục quản trị hệ thống ở trên.
const quickLinks = {
  id: 'group-system-quicklinks',
  type: 'group',
  children: [
    {
      id: 'system-council-mgmt-login',
      title: <FormattedMessage id="system-council-mgmt-login" defaultMessage="Quản lý Hội đồng thi" />,
      type: 'item',
      url: '/login',
      icon: icons.LoginOutlined,
      target: true,
      color: 'success.main'
    }
  ]
};

export default { items: [system, quickLinks] };
