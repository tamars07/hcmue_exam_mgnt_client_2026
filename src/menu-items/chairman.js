// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ApartmentOutlined, TeamOutlined, HistoryOutlined } from '@ant-design/icons';

// icons
const icons = { ApartmentOutlined, TeamOutlined, HistoryOutlined };

// ==============================|| MENU ITEMS - CHAIRMAN (ĐIỂM TRƯỞNG) ||============================== //

const chairman = {
  id: 'group-chairman',
  title: <FormattedMessage id="chairman" defaultMessage="Điểm trưởng" />,
  type: 'group',
  roles: ['ADMIN', 'CHAIRMAN'],
  children: [
    {
      id: 'chairman-rooms',
      title: <FormattedMessage id="chairman-rooms" defaultMessage="Kích hoạt phòng thi" />,
      type: 'item',
      url: '/chairman',
      icon: icons.ApartmentOutlined
    },
    {
      id: 'chairman-examinees',
      title: <FormattedMessage id="chairman-examinees" defaultMessage="Thí sinh" />,
      type: 'item',
      url: '/chairman/examinees',
      icon: icons.TeamOutlined
    },
    {
      id: 'chairman-logs',
      title: <FormattedMessage id="chairman-logs" defaultMessage="Nhật ký" />,
      type: 'item',
      url: '/chairman/logs',
      icon: icons.HistoryOutlined
    }
  ]
};

export default chairman;
