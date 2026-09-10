import { useEffect, useState } from 'react';
import councilMgmtService from 'services/council-mgmt.service';

// Danh sách môn thi — dùng chung cho các trang chấm thi (B2-B8) cần chọn subject_id.
export default function useSubjects() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    councilMgmtService
      .getLookup('subjects')
      .then((res) => setSubjects(res.data.data))
      .catch(() => {});
  }, []);

  return subjects;
}
