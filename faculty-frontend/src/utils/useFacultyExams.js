import { useCallback, useEffect, useMemo, useState } from "react";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";

export function useFacultyExams(pushToast, autoLoad = true) {
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await facultyApi.getExams(token);
      setExams(data.exams || []);
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  }, [pushToast, token]);

  useEffect(() => {
    if (autoLoad) loadExams();
  }, [autoLoad, loadExams]);

  const stats = useMemo(() => {
    const active = exams.filter((exam) => exam.isActive).length;
    return { total: exams.length, active, inactive: exams.length - active };
  }, [exams]);

  return { exams, loading, stats, loadExams, setExams };
}
