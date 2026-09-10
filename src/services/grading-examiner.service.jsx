import axios from 'utils/axios';

// Trang giám khảo (workspace) — thay hoidong.js cũ ở app thí sinh.
const BASE = 'api/grading/examiner';

const getAssignments = () => axios.get(`${BASE}/assignments`);
const getAssignmentDetail = (examineeTestCode) => axios.get(`${BASE}/assignments/${examineeTestCode}`);
const submitRubricScore = (payload) => axios.post(`${BASE}/rubric-score`, payload);

const gradingExaminerService = { getAssignments, getAssignmentDetail, submitRubricScore };

export default gradingExaminerService;
