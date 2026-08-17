// project import
import councilMgmt from './council-mgmt';
import chairman from './chairman';

const allGroups = [councilMgmt, chairman];

// ==============================|| MENU ITEMS ||============================== //

// Lọc menu group theo role của người dùng đang đăng nhập — group không khai báo `roles` thì hiện
// với mọi người (giữ hành vi mặc định cũ). Dùng ở Navigation (sidebar), nơi cần đúng menu theo quyền.
export const getMenuItems = (roles) => {
  const roleList = roles || [];
  return {
    items: allGroups.filter((group) => !group.roles || group.roles.some((role) => roleList.includes(role)))
  };
};

// Export mặc định = đầy đủ mọi group, không lọc theo role — dùng cho Breadcrumbs (chỉ tra cứu tiêu
// đề trang theo URL hiện tại, không cần ẩn/hiện theo quyền).
const menuItems = { items: allGroups };

export default menuItems;
