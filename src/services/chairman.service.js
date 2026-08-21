import axios from 'utils/axios';

const BASE = 'api/council-mgmt/chairman';
// "Xem tiến độ"/"bù giờ"/"phục hồi" đã có sẵn từ trước ở các route legacy này (module giám thị/điểm
// trưởng cũ) — không xây route mới trùng chức năng, chỉ gọi thẳng.
const MONITOR_BASE = 'api/monitor';

// Hội đồng / ca thi / phòng thi của điểm trưởng đang đăng nhập
const getMyCouncils = () => axios.get(`${BASE}/councils`);
const getCouncilTurns = (councilCode) => axios.get(`${BASE}/councils/${councilCode}/turns`);
const getCouncilTurnRooms = (councilTurnCode) => axios.get(`${BASE}/council-turns/${councilTurnCode}/rooms`);
const getCouncilTurnDetails = (councilTurnCode) => axios.get(`${BASE}/council-turns/${councilTurnCode}/details`);
// Giám sát kì thi: tiến độ + trạng thái thí sinh của 1 hoặc nhiều phòng thi được chọn trong 1 ca thi
const getRoomsMonitor = (councilTurnCode, roomCodes) =>
  axios.get(`${BASE}/council-turns/${councilTurnCode}/monitor`, { params: { room_codes: roomCodes.join(',') } });

// Kích hoạt / huỷ kích hoạt phòng thi (đơn + hàng loạt)
const activateRoom = (id, message) => axios.put(`${BASE}/council-turn-rooms/${id}/activate`, { message });
const deactivateRoom = (id, message) => axios.put(`${BASE}/council-turn-rooms/${id}/deactivate`, { message });
const activateRoomsBulk = (ids, message) => axios.post(`${BASE}/council-turn-rooms/activate-bulk`, { ids, message });
const deactivateRoomsBulk = (ids, message) => axios.post(`${BASE}/council-turn-rooms/deactivate-bulk`, { ids, message });

// Nhật ký (logs)
const getTestDataImportLogs = (councilTurnCode) =>
  axios.get(`${BASE}/logs/test-data-import`, { params: { council_turn_code: councilTurnCode } });
const getMonitorActivityLogs = (councilTurnCode, roomCode) =>
  axios.get(`${BASE}/logs/monitor-activity`, { params: { council_turn_code: councilTurnCode, room_code: roomCode || undefined } });
const getExamineeActivityLogs = (examineeAccount) =>
  axios.get(`${BASE}/logs/examinee-activity`, { params: { examinee_account: examineeAccount } });
// Tìm thí sinh theo tài khoản/CCCD-MSSV/họ lót/tên khi không nhớ ca thi/phòng thi
const searchExaminees = (councilCode, search) => axios.get(`${BASE}/logs/examinees/search`, { params: { council_code: councilCode, search } });

// Tổng quan / thống kê thí sinh theo hội đồng thi (lọc thêm được theo ca thi/phòng thi). Khi không
// chọn phòng cụ thể, onlyActiveRooms cho phép chỉ tính trên các phòng đã kích hoạt.
const getDashboardStats = (councilCode, turnCode, roomCode, onlyActiveRooms) =>
  axios.get(`${BASE}/dashboard/stats`, {
    params: {
      council_code: councilCode,
      council_turn_code: turnCode || undefined,
      room_code: roomCode || undefined,
      only_active_rooms: !roomCode && onlyActiveRooms ? 1 : undefined
    }
  });

// Nhận đề thi vào ca thi (2 bước: xem trước -> xác nhận) + theo dõi/thu hồi/khoá đề đã nhận
const previewTestMixImport = (turnCode, formData) =>
  axios.post(`${BASE}/council-turns/${turnCode}/test-mixes/import/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
const commitTestMixImport = (turnCode, importToken) =>
  axios.post(`${BASE}/council-turns/${turnCode}/test-mixes/import/commit`, { import_token: importToken });
const getImportedTestMixes = (turnCode) => axios.get(`${BASE}/council-turns/${turnCode}/test-mixes`);
const revokeTestMixBatch = (turnCode, testGroupId) => axios.delete(`${BASE}/council-turns/${turnCode}/test-mixes/batch/${testGroupId}`);
const lockTestMix = (id) => axios.put(`${BASE}/test-mixes/${id}/lock`);
const unlockTestMix = (id) => axios.put(`${BASE}/test-mixes/${id}/unlock`);

// Khôi phục câu trả lời từ nhật ký + reset kết quả thí sinh
const restoreAnswersFromLog = (account, payload) => axios.post(`${BASE}/examinees/${account}/restore-answers`, payload);
const resetExamineeResult = (account, payload) => axios.post(`${BASE}/examinees/${account}/reset-result`, payload);

// Xem tiến độ làm bài theo phòng (đã có từ trước)
const getExamineesByRoom = (turnCode, roomCode) => axios.get(`${MONITOR_BASE}/examinees`, { params: { turn: turnCode, room: roomCode } });
const getExamineeDetail = (account) => axios.get(`${MONITOR_BASE}/get-examinee-detail`, { params: { account } });

// Bù giờ (đã có từ trước)
const addTime = (payload) => axios.post(`${MONITOR_BASE}/add-time`, payload);
const addTimeMultiple = (payload) => axios.post(`${MONITOR_BASE}/add-time-multiple`, payload);

// Phục hồi trạng thái (đã có từ trước)
const restoreExaminee = (payload) => axios.post(`${MONITOR_BASE}/restore-examinee`, payload);
const restoreMultiple = (payload) => axios.post(`${MONITOR_BASE}/restore-multiple`, payload);

const chairmanService = {
  getMyCouncils,
  getCouncilTurns,
  getCouncilTurnRooms,
  getCouncilTurnDetails,
  getRoomsMonitor,
  activateRoom,
  deactivateRoom,
  activateRoomsBulk,
  deactivateRoomsBulk,
  getTestDataImportLogs,
  getMonitorActivityLogs,
  getExamineeActivityLogs,
  searchExaminees,
  getDashboardStats,
  previewTestMixImport,
  commitTestMixImport,
  getImportedTestMixes,
  revokeTestMixBatch,
  lockTestMix,
  unlockTestMix,
  restoreAnswersFromLog,
  resetExamineeResult,
  getExamineesByRoom,
  getExamineeDetail,
  addTime,
  addTimeMultiple,
  restoreExaminee,
  restoreMultiple
};

export default chairmanService;
