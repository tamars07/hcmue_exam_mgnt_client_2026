// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { BankOutlined, HomeOutlined, ApartmentOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons';

// icons
const icons = { BankOutlined, HomeOutlined, ApartmentOutlined, TeamOutlined, IdcardOutlined };

// ==============================|| MENU ITEMS - COUNCIL MANAGEMENT ||============================== //

const councilMgmt = {
  id: 'group-council-mgmt',
  title: <FormattedMessage id="council-mgmt" defaultMessage="Tổ chức thi" />,
  type: 'group',
  roles: ['ADMIN', 'MODERATOR'],
  children: [
    {
      id: 'organizations',
      title: <FormattedMessage id="organizations" defaultMessage="Địa điểm thi" />,
      type: 'item',
      url: '/council-mgmt/organizations',
      icon: icons.HomeOutlined
    },
    {
      id: 'rooms',
      title: <FormattedMessage id="rooms" defaultMessage="Phòng thi" />,
      type: 'item',
      url: '/council-mgmt/rooms',
      icon: icons.ApartmentOutlined
    },
    {
      id: 'councils',
      title: <FormattedMessage id="councils" defaultMessage="Hội đồng thi" />,
      type: 'item',
      url: '/council-mgmt/councils',
      icon: icons.BankOutlined
    },
    {
      id: 'examinees',
      title: <FormattedMessage id="examinees" defaultMessage="Danh sách thí sinh" />,
      type: 'item',
      url: '/council-mgmt/examinees',
      icon: icons.TeamOutlined
    },
    {
      id: 'monitors',
      title: <FormattedMessage id="monitors" defaultMessage="Tài khoản cán bộ coi thi" />,
      type: 'item',
      url: '/council-mgmt/monitors',
      icon: icons.IdcardOutlined
    }
  ]
};

export default councilMgmt;
