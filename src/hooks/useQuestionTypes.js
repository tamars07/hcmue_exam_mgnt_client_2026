import { useEffect, useState } from 'react';
import councilMgmtService from 'services/council-mgmt.service';

// Danh sách loại câu hỏi (TN1, TNN, TNC, TLN, Bài văn/tự luận) — dùng cho B2.
export default function useQuestionTypes() {
  const [questionTypes, setQuestionTypes] = useState([]);

  useEffect(() => {
    councilMgmtService
      .getLookup('question_types')
      .then((res) => setQuestionTypes(res.data.data))
      .catch(() => {});
  }, []);

  return questionTypes;
}
