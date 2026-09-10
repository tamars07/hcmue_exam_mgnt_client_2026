// Màu chip theo role_id — cố định theo RoleSeeder (1 ADMIN ... 8 EXAMINEE), dùng chung cho các
// bảng nhật ký (Nhật ký hệ thống, Nhật ký kì thi) để cùng 1 vai trò luôn hiện cùng 1 màu.
const ROLE_CHIP_COLORS = {
  1: '#d32f2f', // ADMIN
  2: '#7b1fa2', // MODERATOR
  3: '#1976d2', // EDITOR
  4: '#f57c00', // MONITOR - Cán bộ coi thi
  5: '#5d4037', // EXAMINER
  6: '#0097a7', // REVIEWER
  7: '#303f9f', // CHAIRMAN - Điểm trưởng
  8: '#388e3c' // EXAMINEE - Thí sinh
};

export const getRoleChipColor = (roleId) => ROLE_CHIP_COLORS[roleId] || '#616161';
