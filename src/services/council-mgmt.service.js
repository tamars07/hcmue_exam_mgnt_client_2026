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

// Lookups (dropdown)
const getLookup = (type, params) => axios.get(`${BASE}/lookups/${type}`, { params });

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
  getLookup
};

export default councilMgmtService;
