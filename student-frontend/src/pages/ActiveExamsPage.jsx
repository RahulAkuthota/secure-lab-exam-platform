import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../api";
import { studentStorage } from "../storage";
import PageShell from "../layout/PageShell";

const computeExamExpiry = (examData) => {
  const now = Date.now();
  const durationMins = Number(examData?.duration);
  const endTimeMs = examData?.endTime ? new Date(examData.endTime).getTime() : NaN;

  const byDuration = Number.isFinite(durationMins) && durationMins > 0
    ? now + durationMins * 60 * 1000
    : NaN;
  const byExamEnd = Number.isFinite(endTimeMs) && endTimeMs > now ? endTimeMs : NaN;

  if (Number.isFinite(byDuration) && Number.isFinite(byExamEnd)) {
    return Math.min(byDuration, byExamEnd);
  }
  if (Number.isFinite(byDuration)) return byDuration;
  if (Number.isFinite(byExamEnd)) return byExamEnd;
  return NaN;
};

function ActiveExamsPage({ pushToast }) {
  const navigate = useNavigate();
  const token = studentStorage.get(studentStorage.keys.token);
  const student = studentStorage.get(studentStorage.keys.profile);
  const tokenExam = studentStorage.get(studentStorage.keys.exam);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const tokenExamId = tokenExam?.id || tokenExam?._id || "";

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await studentApi.activeExams(token);
      setExams(data.exams || []);
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const startExam = async (examId) => {
    if (tokenExamId && examId !== tokenExamId) {
      pushToast("error", "Your session token is valid only for the assigned exam.");
      return;
    }

    setBusyId(examId);
    try {
      const confirmed = window.confirm("Start exam now?");
      if (!confirmed) return;
      const data = await studentApi.startExam(token, tokenExamId || examId);
      const examData = data.exam || {};
      const expiresAt = computeExamExpiry(examData);

      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        pushToast("error", "Exam timing is invalid or already expired. Contact faculty.");
        return;
      }

      studentStorage.set(studentStorage.keys.exam, examData);
      studentStorage.set(studentStorage.keys.questions, data.questions || []);
      studentStorage.set(studentStorage.keys.examSession, {
        startedAt: Date.now(),
        expiresAt,
      });
      pushToast("success", "Exam started");
      navigate("/exam");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <PageShell
      title={`Welcome, ${student?.name || "Student"}`}
      subtitle="Select an active exam and begin."
      rightAction={
        <button
          className="ghost-btn"
          onClick={() => {
            studentStorage.clear();
            navigate("/", { replace: true });
          }}
        >
          End Session
        </button>
      }
    >
      <section className="card">
        <div className="section-head">
          <h2>Active Exams</h2>
          <button className="ghost-btn" onClick={loadExams}>
            Refresh
          </button>
        </div>
        <p className="meta">
          Token exam: <strong>{tokenExam?.title || "Not assigned"}</strong>
        </p>
        {tokenExamId ? (
          <p className="meta">Only your assigned exam can be started in this session.</p>
        ) : null}
        {loading ? <div className="empty">Loading active exams...</div> : null}
        {!loading && exams.length === 0 ? (
          <div className="empty">No active exams available.</div>
        ) : null}
        <div className="list">
          {exams.map((exam) => (
            <article className="exam-card" key={exam._id}>
              <div>
                <h3>{exam.title}</h3>
                <p className="meta">
                  Duration: {exam.duration} mins | Ends {new Date(exam.endTime).toLocaleString()}
                </p>
                {Array.isArray(exam.allowedLanguages) && exam.allowedLanguages.length > 0 ? (
                  <p className="meta">Languages: {exam.allowedLanguages.join(", ")}</p>
                ) : (
                  <p className="meta">Languages: No restriction</p>
                )}
              </div>
              <button
                className="primary-btn"
                disabled={busyId === exam._id || (tokenExamId && tokenExamId !== exam._id)}
                onClick={() => startExam(exam._id)}
              >
                {tokenExamId && tokenExamId !== exam._id
                  ? "Not Allowed"
                  : busyId === exam._id
                    ? "Starting..."
                    : "Start Exam"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export default ActiveExamsPage;
