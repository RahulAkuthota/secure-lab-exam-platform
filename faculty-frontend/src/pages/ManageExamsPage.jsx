import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useFacultyExams } from "../utils/useFacultyExams";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";
import { useState } from "react";

function ManageExamsPage({ pushToast }) {
  const navigate = useNavigate();
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const { exams, loading, loadExams } = useFacultyExams(pushToast);
  const [busyAction, setBusyAction] = useState("");

  const changeStatus = async (examId, shouldActivate) => {
    setBusyAction(`status-${examId}`);
    try {
      if (shouldActivate) {
        await facultyApi.activate(token, examId);
        pushToast("success", "Exam activated");
      } else {
        await facultyApi.deactivate(token, examId);
        pushToast("success", "Exam deactivated");
      }
      await loadExams();
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setBusyAction("");
    }
  };

  return (
    <DashboardLayout
      title="Manage Exams"
      subtitle="Step 2: choose an exam and add/edit coding questions."
      onRefresh={loadExams}
    >
      <section className="card">
        <h2>Exam List</h2>
        <div className="exam-grid">
          {loading ? <div className="empty">Loading exams...</div> : null}
          {!loading && exams.length === 0 ? (
            <div className="empty">No exams available. Create one first.</div>
          ) : null}
          {exams.map((exam) => (
            <article className="exam-row clean" key={exam._id}>
              <div>
                <h3>{exam.title}</h3>
                <p className="meta">
                  {new Date(exam.startTime).toLocaleString()} to{" "}
                  {new Date(exam.endTime).toLocaleString()}
                </p>
                <span className={`chip ${exam.isActive ? "active" : "inactive"}`}>
                  {exam.isActive ? "Active" : "Inactive"}
                </span>
                {Array.isArray(exam.allowedLanguages) && exam.allowedLanguages.length > 0 ? (
                  <div className="exam-languages">
                    {exam.allowedLanguages.map((language) => (
                      <span className="lang-chip" key={`${exam._id}-${language}`}>
                        {language}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="meta">Languages: No restriction</p>
                )}
              </div>
              <div className="row-actions">
                <button
                  className="ghost-btn"
                  onClick={() => navigate(`/dashboard/exams/${exam._id}/edit`)}
                >
                  Edit Exam
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => navigate(`/dashboard/exams/${exam._id}/questions`)}
                >
                  Add/Edit Questions
                </button>
                <button
                  className="primary-btn"
                  disabled={busyAction === `status-${exam._id}` || exam.isActive}
                  onClick={() => changeStatus(exam._id, true)}
                >
                  Activate
                </button>
                <button
                  className="ghost-btn"
                  disabled={busyAction === `status-${exam._id}` || !exam.isActive}
                  onClick={() => changeStatus(exam._id, false)}
                >
                  Deactivate
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default ManageExamsPage;
