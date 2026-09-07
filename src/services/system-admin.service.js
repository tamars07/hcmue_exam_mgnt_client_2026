import axios from 'utils/axiosSystem';

const BASE = 'api/system';

// Auth
const login = (email, password) => axios.post(`${BASE}/auth/login`, { email, password });
const me = () => axios.get(`${BASE}/auth/me`);
const logout = () => axios.post(`${BASE}/auth/logout`);

// Exam databases
const getExamDatabases = (withArchived) => axios.get(`${BASE}/exam-databases`, { params: { with_archived: withArchived ? 1 : 0 } });
const createExamDatabase = (formData) =>
  axios.post(`${BASE}/exam-databases`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const selectExamDatabase = (id) => axios.put(`${BASE}/exam-databases/${id}/select`);
const archiveExamDatabase = (id) => axios.put(`${BASE}/exam-databases/${id}/archive`);
const unarchiveExamDatabase = (id) => axios.put(`${BASE}/exam-databases/${id}/unarchive`);
const deleteExamDatabase = (id, confirmDbName) =>
  axios.delete(`${BASE}/exam-databases/${id}`, { data: { confirm_db_name: confirmDbName } });

// Backups
const runBackup = (id) => axios.post(`${BASE}/exam-databases/${id}/backup`);
const restoreBackup = (id, formData) =>
  axios.post(`${BASE}/exam-databases/${id}/restore-backup`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const getBackups = (id) => axios.get(`${BASE}/exam-databases/${id}/backups`);
const downloadBackup = (id, backupId) => axios.get(`${BASE}/exam-databases/${id}/backups/${backupId}/download`, { responseType: 'blob' });
const deleteBackup = (id, backupId) => axios.delete(`${BASE}/exam-databases/${id}/backups/${backupId}`);

// Tài khoản ADMIN của 1 DB kỳ thi bất kỳ (không cần đặt DB đó làm active)
const getAdminAccounts = (id) => axios.get(`${BASE}/exam-databases/${id}/admin-accounts`);
const createAdminAccount = (id, data) => axios.post(`${BASE}/exam-databases/${id}/admin-accounts`, data);
const updateAdminAccount = (id, monitorId, data) => axios.put(`${BASE}/exam-databases/${id}/admin-accounts/${monitorId}`, data);
const deleteAdminAccount = (id, monitorId) => axios.delete(`${BASE}/exam-databases/${id}/admin-accounts/${monitorId}`);

// SQL table import
const previewSqlImport = (id, formData) =>
  axios.post(`${BASE}/exam-databases/${id}/sql-import/preview`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const commitSqlImport = (id, payload) => axios.post(`${BASE}/exam-databases/${id}/sql-import/commit`, payload);

// Kho dữ liệu dùng chung — Địa điểm thi
const getMasterOrganizations = () => axios.get(`${BASE}/master-organizations`);
const createMasterOrganization = (data) => axios.post(`${BASE}/master-organizations`, data);
const updateMasterOrganization = (id, data) => axios.put(`${BASE}/master-organizations/${id}`, data);
const deleteMasterOrganization = (id) => axios.delete(`${BASE}/master-organizations/${id}`);

// Kho dữ liệu dùng chung — Phòng thi
const getMasterRooms = (organizationId) => axios.get(`${BASE}/master-rooms`, { params: { master_organization_id: organizationId } });
const createMasterRoom = (data) => axios.post(`${BASE}/master-rooms`, data);
const updateMasterRoom = (id, data) => axios.put(`${BASE}/master-rooms/${id}`, data);
const deleteMasterRoom = (id) => axios.delete(`${BASE}/master-rooms/${id}`);

// Kho dữ liệu dùng chung — Điểm trưởng
const getMasterMonitors = (organizationId) =>
  axios.get(`${BASE}/master-monitors`, { params: organizationId ? { master_organization_id: organizationId } : {} });
const createMasterMonitor = (data) => axios.post(`${BASE}/master-monitors`, data);
const updateMasterMonitor = (id, data) => axios.put(`${BASE}/master-monitors/${id}`, data);
const deleteMasterMonitor = (id) => axios.delete(`${BASE}/master-monitors/${id}`);
const activateMasterMonitor = (id) => axios.put(`${BASE}/master-monitors/${id}/activate`);
const regenerateMasterMonitorPassword = (id) => axios.put(`${BASE}/master-monitors/${id}/regenerate-password`);

// Đồng bộ kho dữ liệu dùng chung vào 1 DB kỳ thi đã tồn tại
const syncMasterData = (examDatabaseId, organizationIds) =>
  axios.post(`${BASE}/exam-databases/${examDatabaseId}/sync-master-data`, { organization_ids: organizationIds });

// Nhật ký thao tác Super Admin
const getActivityLogs = (params) => axios.get(`${BASE}/activity-logs`, { params });
const getActivityLogActions = () => axios.get(`${BASE}/activity-logs/actions`);

const systemAdminService = {
  login,
  me,
  logout,
  getExamDatabases,
  createExamDatabase,
  selectExamDatabase,
  archiveExamDatabase,
  unarchiveExamDatabase,
  deleteExamDatabase,
  getAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
  runBackup,
  restoreBackup,
  getBackups,
  downloadBackup,
  deleteBackup,
  previewSqlImport,
  commitSqlImport,
  getMasterOrganizations,
  createMasterOrganization,
  updateMasterOrganization,
  deleteMasterOrganization,
  getMasterRooms,
  createMasterRoom,
  updateMasterRoom,
  deleteMasterRoom,
  getMasterMonitors,
  createMasterMonitor,
  updateMasterMonitor,
  deleteMasterMonitor,
  activateMasterMonitor,
  regenerateMasterMonitorPassword,
  syncMasterData,
  getActivityLogs,
  getActivityLogActions
};

export default systemAdminService;
