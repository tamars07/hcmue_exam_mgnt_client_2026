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

// SQL table import
const previewSqlImport = (id, formData) =>
  axios.post(`${BASE}/exam-databases/${id}/sql-import/preview`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
const commitSqlImport = (id, payload) => axios.post(`${BASE}/exam-databases/${id}/sql-import/commit`, payload);

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
  runBackup,
  restoreBackup,
  getBackups,
  downloadBackup,
  deleteBackup,
  previewSqlImport,
  commitSqlImport,
  getActivityLogs,
  getActivityLogActions
};

export default systemAdminService;
