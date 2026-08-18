// Định dạng ngày giờ bắt đầu của 1 ca thi theo yyyy/mm/dd hh:ii, dùng chung ở mọi nơi hiển thị tên
// ca thi (vd "Ca thi 1 - 2026/08/20 13:00") — không quy đổi múi giờ, hiển thị đúng giờ đã lưu.
export const formatTurnSchedule = (startAt) => {
  if (!startAt) return '';
  const date = new Date(String(startAt).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Nhãn hiển thị đầy đủ cho 1 ca thi: "Ca thi 1 - 2026/08/20 13:00"
export const formatTurnLabel = (turn) => {
  const schedule = formatTurnSchedule(turn?.start_at);
  return schedule ? `${turn?.name} - ${schedule}` : turn?.name || '';
};

// Kiểm tra 1 hội đồng thi có đang diễn ra trong ngày hôm nay hay không (so sánh start_at/finish_at
// theo ngày, bỏ qua giờ) — dùng chung cho các trang điểm trưởng cần lọc "hội đồng thi hôm nay".
export const isCouncilRunningToday = (council) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(council.start_at);
  start.setHours(0, 0, 0, 0);
  const finish = new Date(council.finish_at);
  finish.setHours(0, 0, 0, 0);
  return today >= start && today <= finish;
};

// Kiểm tra 1 ca thi có diễn ra đúng ngày hôm nay hay không (so sánh start_at theo ngày, bỏ qua
// giờ) — dùng để chặn thao tác (kích hoạt/bù giờ/phục hồi/reset...) trên ca thi khác ngày, chỉ cho
// xem thông tin (read-only) với các ca thi đó trong nhóm menu Quản lý Kì thi.
export const isTurnToday = (turn) => {
  if (!turn?.start_at) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const turnDate = new Date(String(turn.start_at).replace(' ', 'T'));
  turnDate.setHours(0, 0, 0, 0);
  return turnDate.getTime() === today.getTime();
};
