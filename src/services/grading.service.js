import axios from 'utils/axios';

// Nghiệp vụ chấm thi (B1-B8), phía admin/điểm trưởng. Xem services/grading-examiner.service.js cho
// phía giám khảo (trang workspace).
const BASE = 'api/grading';

const toListParams = ({ page = 0, pageSize = 20, ...rest } = {}) => ({ page, pageSize, ...rest });

// B1 — nhập dữ liệu chấm thi
const importBak = (files, onUploadProgress) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files[]', file));
  return axios.post(`${BASE}/import/bak`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress });
};
const generatePhach = (payload) => axios.post(`${BASE}/import/generate-phach`, payload);
const getPhachOverview = (params) => axios.get(`${BASE}/import/phach`, { params: toListParams(params) });

// B2 — đáp án
const getAnswerKeys = (params) => axios.get(`${BASE}/answer-keys`, { params: toListParams(params) });
const getAnswerKeyDetail = (questionId) => axios.get(`${BASE}/answer-keys/${questionId}`);
const updateAnswerKey = (questionId, payload) => axios.put(`${BASE}/answer-keys/${questionId}`, payload);

// B2 — rubric + tiêu chí chấm tự luận
const getRubrics = (params) => axios.get(`${BASE}/rubrics`, { params: toListParams(params) });
const createRubric = (payload) => axios.post(`${BASE}/rubrics`, payload);
const updateRubric = (id, payload) => axios.put(`${BASE}/rubrics/${id}`, payload);
const getRubricCriterias = (id) => axios.get(`${BASE}/rubrics/${id}/criterias`);
const updateRubricCriterias = (id, criterias, forceReset) =>
  axios.put(`${BASE}/rubrics/${id}/criterias`, { criterias, force_reset: forceReset || undefined });

// B3 — chấm tự động (5 phạm vi)
const autoMarkAll = () => axios.post(`${BASE}/auto-marking/all`);
const autoMarkByCouncil = (councilCode) => axios.post(`${BASE}/auto-marking/council/${councilCode}`);
const autoMarkByCouncilTurn = (councilTurnCode) => axios.post(`${BASE}/auto-marking/council-turn/${councilTurnCode}`);
const autoMarkBySubject = (subjectId) => axios.post(`${BASE}/auto-marking/subject/${subjectId}`);
const autoMarkByExaminee = (examineeTestCode) => axios.post(`${BASE}/auto-marking/examinee/${examineeTestCode}`);

// B4 — tài khoản giám khảo
const getExaminers = (params) => axios.get(`${BASE}/examiners`, { params: toListParams(params) });
const createExaminer = (payload) => axios.post(`${BASE}/examiners`, payload);
const importExaminers = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${BASE}/examiners/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// B5 — cặp giám khảo
const getExaminerPairs = (params) => axios.get(`${BASE}/examiner-pairs`, { params: toListParams(params) });
const createExaminerPair = (payload) => axios.post(`${BASE}/examiner-pairs`, payload);
const autoPairExaminers = (payload) => axios.post(`${BASE}/examiner-pairs/auto`, payload);
const replaceExaminerInPair = (pairId, payload) => axios.put(`${BASE}/examiner-pairs/${pairId}/replace-examiner`, payload);

// B6 — phân bài
const assignToPair = (pairId, payload) => axios.post(`${BASE}/examiner-pairs/${pairId}/assign`, payload);
const unassignFromPair = (pairId, payload) => axios.post(`${BASE}/examiner-pairs/${pairId}/unassign`, payload);
const autoDistributeAssignments = (payload) => axios.post(`${BASE}/assignments/auto-distribute`, payload);

// B7 — lệch điểm / giám khảo thứ 3
const getDeviations = (params) => axios.get(`${BASE}/deviations`, { params: toListParams(params) });
const getDeviationDetail = (stateId) => axios.get(`${BASE}/deviations/${stateId}`);
const assignThirdExaminer = (stateId, payload) => axios.post(`${BASE}/deviations/${stateId}/assign-third-examiner`, payload);

// B8 — công thức điểm + bảng điểm
const getScoreFormula = (subjectId) => axios.get(`${BASE}/score-formulas/${subjectId}`);
const updateScoreFormula = (subjectId, payload) => axios.put(`${BASE}/score-formulas/${subjectId}`, payload);
const getResultsSummary = (params) => axios.get(`${BASE}/results/summary`, { params });
const downloadResultsSummaryXlsx = (params) => axios.get(`${BASE}/results/summary.xlsx`, { params, responseType: 'blob' });
const downloadResultsDetailXlsx = (params) => axios.get(`${BASE}/results/detail.xlsx`, { params, responseType: 'blob' });

const gradingService = {
  importBak,
  generatePhach,
  getPhachOverview,
  getAnswerKeys,
  getAnswerKeyDetail,
  updateAnswerKey,
  getRubrics,
  createRubric,
  updateRubric,
  getRubricCriterias,
  updateRubricCriterias,
  autoMarkAll,
  autoMarkByCouncil,
  autoMarkByCouncilTurn,
  autoMarkBySubject,
  autoMarkByExaminee,
  getExaminers,
  createExaminer,
  importExaminers,
  getExaminerPairs,
  createExaminerPair,
  autoPairExaminers,
  replaceExaminerInPair,
  assignToPair,
  unassignFromPair,
  autoDistributeAssignments,
  getDeviations,
  getDeviationDetail,
  assignThirdExaminer,
  getScoreFormula,
  updateScoreFormula,
  getResultsSummary,
  downloadResultsSummaryXlsx,
  downloadResultsDetailXlsx
};

export default gradingService;
