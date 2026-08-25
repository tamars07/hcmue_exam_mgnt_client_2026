// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ApartmentOutlined, TeamOutlined, HistoryOutlined, PieChartOutlined, ImportOutlined } from '@ant-design/icons';

// icons
const icons = { ApartmentOutlined, TeamOutlined, HistoryOutlined, PieChartOutlined, ImportOutlined };

// ==============================|| MENU ITEMS - CHAIRMAN (ĐIỂM TRƯỞNG) ||============================== //

const chairman = {
  id: 'group-chairman',
  title: <FormattedMessage id="chairman" defaultMessage="Quản lý Kì thi" />,
  type: 'group',
  roles: ['ADMIN', 'CHAIRMAN'],
  children: [
    {
      id: 'chairman-dashboard',
      title: <FormattedMessage id="chairman-dashboard" defaultMessage="Tổng quan" />,
      type: 'item',
      url: '/chairman/dashboard',
      icon: icons.PieChartOutlined
    },
    {
      id: 'chairman-rooms',
      title: <FormattedMessage id="chairman-rooms" defaultMessage="Quản lý ca thi" />,
      type: 'item',
      url: '/chairman/rooms',
      icon: icons.ApartmentOutlined
    },
    {
      id: 'chairman-test-import',
      title: <FormattedMessage id="chairman-test-import" defaultMessage="Nhận đề thi" />,
      type: 'item',
      url: '/chairman/test-import',
      icon: icons.ImportOutlined
    },
    {
      id: 'chairman-examinees',
      title: <FormattedMessage id="chairman-examinees" defaultMessage="Giám sát ca thi" />,
      type: 'item',
      url: '/chairman/examinees',
      icon: icons.TeamOutlined
    },
    {
      id: 'chairman-logs',
      title: <FormattedMessage id="chairman-logs" defaultMessage="Nhật ký kì thi" />,
      type: 'item',
      url: '/chairman/logs',
      icon: icons.HistoryOutlined
    }
  ]
};

export default chairman;
