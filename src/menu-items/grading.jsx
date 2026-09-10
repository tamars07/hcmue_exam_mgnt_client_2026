// third-party
import { FormattedMessage } from 'react-intl';

// assets
import {
  ImportOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  UsergroupAddOutlined,
  ScheduleOutlined,
  WarningOutlined,
  FunctionOutlined,
  BarChartOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ImportOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  EditOutlined,
  UsergroupAddOutlined,
  ScheduleOutlined,
  WarningOutlined,
  FunctionOutlined,
  BarChartOutlined
};

// ==============================|| MENU ITEMS - CHẤM THI (B1-B8) ||============================== //
// Không gồm EXAMINER — giám khảo có trang workspace riêng (full-screen, không qua menu này), xem
// ExaminerGuard + GuestGuard (điều hướng thẳng sau đăng nhập).

const grading = {
  id: 'group-grading',
  title: <FormattedMessage id="grading" defaultMessage="Chấm thi" />,
  type: 'group',
  roles: ['ADMIN', 'MODERATOR', 'CHAIRMAN'],
  children: [
    {
      id: 'grading-import-data',
      title: <FormattedMessage id="grading-import-data" defaultMessage="Nhập dữ liệu chấm thi" />,
      type: 'item',
      url: '/grading/import-data',
      icon: icons.ImportOutlined
    },
    {
      id: 'grading-answer-keys',
      title: <FormattedMessage id="grading-answer-keys" defaultMessage="Đáp án & Rubric" />,
      type: 'item',
      url: '/grading/answer-keys',
      icon: icons.FileTextOutlined
    },
    {
      id: 'grading-auto-marking',
      title: <FormattedMessage id="grading-auto-marking" defaultMessage="Chấm thi tự động" />,
      type: 'item',
      url: '/grading/auto-marking',
      icon: icons.CheckCircleOutlined
    },
    {
      id: 'grading-manual-marking',
      title: <FormattedMessage id="grading-manual-marking" defaultMessage="Chấm thi thủ công" />,
      type: 'collapse',
      icon: icons.EditOutlined,
      children: [
        {
          id: 'grading-examiner-pairs',
          title: <FormattedMessage id="grading-examiner-pairs" defaultMessage="Tạo cặp chấm thi" />,
          type: 'item',
          url: '/grading/examiner-pairs',
          icon: icons.UsergroupAddOutlined
        },
        {
          id: 'grading-assignments',
          title: <FormattedMessage id="grading-assignments" defaultMessage="Phân công chấm thi" />,
          type: 'item',
          url: '/grading/assignments',
          icon: icons.ScheduleOutlined
        }
      ]
    },
    {
      id: 'grading-deviations',
      title: <FormattedMessage id="grading-deviations" defaultMessage="Xử lý lệch điểm" />,
      type: 'item',
      url: '/grading/deviations',
      icon: icons.WarningOutlined
    },
    {
      id: 'grading-scoreboard',
      title: <FormattedMessage id="grading-scoreboard" defaultMessage="Bảng điểm" />,
      type: 'collapse',
      icon: icons.BarChartOutlined,
      children: [
        {
          id: 'grading-score-formulas',
          title: <FormattedMessage id="grading-score-formulas" defaultMessage="Công thức tính điểm" />,
          type: 'item',
          url: '/grading/score-formulas',
          icon: icons.FunctionOutlined
        },
        {
          id: 'grading-results',
          title: <FormattedMessage id="grading-results" defaultMessage="Tổng hợp điểm" />,
          type: 'item',
          url: '/grading/results',
          icon: icons.BarChartOutlined
        }
      ]
    }
  ]
};

export default grading;
