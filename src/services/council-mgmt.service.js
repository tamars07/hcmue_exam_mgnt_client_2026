import axios from 'utils/axios';

const BASE = 'api/council-mgmt';

const toListParams = ({ page = 0, pageSize = 20, search = '', sort, order, ...rest } = {}) => ({
  page,
  pageSize,
  search,
  sort,
  order,
  ...rest
});

// Organizations (địa điểm thi)
const getOrganizations = (params) => axios.get(`${BASE}/organizations`, { params: toListParams(params) });
const createOrganization = (data) => axios.post(`${BASE}/organizations`, data);
const updateOrganization = (code, data) => axios.put(`${BASE}/organizations/${code}`, data);
const deleteOrganization = (code) => axios.delete(`${BASE}/organizations/${code}`);

// Rooms (phòng thi)
const getRooms = (params) => axios.get(`${BASE}/rooms`, { params: toListParams(params) });
const createRoom = (data) => axios.post(`${BASE}/rooms`, data);
const updateRoom = (code, data) => axios.put(`${BASE}/rooms/${code}`, data);
const deleteRoom = (code) => axios.delete(`${BASE}/rooms/${code}`);

// Councils (hội đồng thi)
const getCouncils = (params) => axios.get(`${BASE}/councils`, { params: toListParams(params) });
const getCouncil = (code) => axios.get(`${BASE}/councils/${code}`);
const createCouncil = (data) => axios.post(`${BASE}/councils`, data);
const updateCouncil = (code, data) => axios.put(`${BASE}/councils/${code}`, data);

// Council turns (ca thi)
const getCouncilTurns = (councilCode) => axios.get(`${BASE}/councils/${councilCode}/turns`);
const updateCouncilTurn = (code, data) => axios.put(`${BASE}/council-turns/${code}`, data);

// Council turn rooms (gán phòng thi cho ca thi)
const getCouncilTurnRooms = (councilTurnCode) => axios.get(`${BASE}/council-turns/${councilTurnCode}/rooms`);
const assignCouncilTurnRoom = (data) => axios.post(`${BASE}/council-turn-rooms`, data);
const unassignCouncilTurnRoom = (id) => axios.delete(`${BASE}/council-turn-rooms/${id}`);
// Xem thông tin phòng thi + giám thị (tài khoản/mật khẩu) + thí sinh của từng phòng trong ca thi
const getCouncilTurnDetails = (councilTurnCode) => axios.get(`${BASE}/council-turns/${councilTurnCode}/details`);
// Kích hoạt phòng thi (cho phép thí sinh làm bài)
const activateCouncilTurnRoom = (id) => axios.put(`${BASE}/council-turn-rooms/${id}/activate`);
// Xuất phiếu tài khoản (docx) cho thí sinh trong phòng thi
const exportCouncilTurnRoomAccounts = (id) => axios.get(`${BASE}/council-turn-rooms/${id}/export-accounts`, { responseType: 'blob' });
// Xuất phiếu tài khoản (docx) của nhiều phòng thi cùng lúc, đóng gói vào 1 file .zip
const exportCouncilTurnRoomAccountsZip = (ids) =>
  axios.post(`${BASE}/council-turn-rooms/export-accounts-zip`, { ids }, { responseType: 'blob' });
// Xuất file Excel tài khoản cán bộ coi thi (kèm điểm trưởng) của toàn bộ phòng thi trong 1 ca thi
const exportCouncilTurnMonitorAccounts = (councilTurnCode) =>
  axios.get(`${BASE}/council-turns/${councilTurnCode}/export-monitor-accounts`, { responseType: 'blob' });

// Examinees (thí sinh)
const getExaminees = (params) => axios.get(`${BASE}/examinees`, { params: toListParams(params) });
// Tải file Excel mẫu để import thí sinh — kèm council_code/council_turn_code (nếu có) để dòng ví dụ
// dùng tên môn thi/phòng thi/ca thi có thật của hội đồng đang chọn.
const downloadExamineeImportTemplate = (params) => axios.get(`${BASE}/examinees/import/template`, { params, responseType: 'blob' });
const importExamineesPreview = (formData) =>
  axios.post(`${BASE}/examinees/import/preview`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const importExamineesCommit = (payload) => axios.post(`${BASE}/examinees/import/commit`, payload);

// Lookups (dropdown)
const getLookup = (type, params) => axios.get(`${BASE}/lookups/${type}`, { params });

// Monitors (tài khoản Cán bộ coi thi + Điểm trưởng)
const getMonitors = (params) => axios.get(`${BASE}/monitors`, { params: toListParams(params) });
const createMonitor = (data) => axios.post(`${BASE}/monitors`, data);
const updateMonitor = (id, data) => axios.put(`${BASE}/monitors/${id}`, data);
const deleteMonitor = (id) => axios.delete(`${BASE}/monitors/${id}`);

const councilMgmtService = {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getCouncils,
  getCouncil,
  createCouncil,
  updateCouncil,
  getCouncilTurns,
  updateCouncilTurn,
  getCouncilTurnRooms,
  assignCouncilTurnRoom,
  unassignCouncilTurnRoom,
  getCouncilTurnDetails,
  activateCouncilTurnRoom,
  exportCouncilTurnRoomAccounts,
  exportCouncilTurnRoomAccountsZip,
  exportCouncilTurnMonitorAccounts,
  getExaminees,
  downloadExamineeImportTemplate,
  importExamineesPreview,
  importExamineesCommit,
  getLookup,
  getMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor
};

export default councilMgmtService;
