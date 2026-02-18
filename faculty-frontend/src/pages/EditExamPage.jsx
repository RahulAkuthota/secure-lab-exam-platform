import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useFacultyExams } from "../utils/useFacultyExams";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";

const LANGUAGE_OPTIONS = ["c", "cpp", "java", "python", "javascript"];

function toLocalDateTimeInput(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function EditExamPage({ pushToast }) {
  const navigate = useNavigate();
  const { examId } = useParams();
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const { exams, loading } = useFacultyExams(pushToast);
  const exam = useMemo(() => exams.find((item) => item._id === examId), [exams, examId]);

  const [form, setForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    duration: "",
    allowedLanguages: [],
  });
  const [initializedId, setInitializedId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!exam || initializedId === exam._id) return;
    setForm({
      title: exam.title || "",
      startTime: toLocalDateTimeInput(exam.startTime),
      endTime: toLocalDateTimeInput(exam.endTime),
      duration: String(exam.duration || ""),
      allowedLanguages: Array.isArray(exam.allowedLanguages) ? exam.allowedLanguages : [],
    });
    setInitializedId(exam._id);
  }, [exam, initializedId]);

  const toggleLanguage = (language) => {
    setForm((prev) => {
      const hasLanguage = prev.allowedLanguages.includes(language);
      return {
        ...prev,
        allowedLanguages: hasLanguage
          ? prev.allowedLanguages.filter((item) => item !== language)
          : [...prev.allowedLanguages, language],
      };
    });
  };

  const updateExam = async (event) => {
    event.preventDefault();
    if (!exam) return;
    setBusy(true);
    try {
      await facultyApi.updateExam(token, exam._id, {
        title: form.title.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        duration: Number(form.duration) || undefined,
        allowedLanguages: form.allowedLanguages,
      });
      pushToast("success", "Exam details updated successfully");
      navigate("/dashboard/manage-exams");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout
      title="Edit Exam Details"
      subtitle="Update exam name, timing, duration, and language restriction."
    >
      <section className="card">
        {loading ? <div className="empty">Loading exam details...</div> : null}
        {!loading && !exam ? <div className="empty">Exam not found.</div> : null}
        {!loading && exam ? (
          <form className="form-grid" onSubmit={updateExam}>
            <label>
              Exam Title
              <input
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <div className="two-cols">
              <label>
                Start Time
                <input
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
              </label>
              <label>
                End Time
                <input
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                />
              </label>
            </div>
            <label>
              Duration (minutes)
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, duration: event.target.value }))
                }
              />
            </label>

            <div className="language-box">
              <p className="meta">Restrict languages (optional)</p>
              <div className="language-grid">
                {LANGUAGE_OPTIONS.map((language) => (
                  <label key={language} className="language-item">
                    <input
                      type="checkbox"
                      checked={form.allowedLanguages.includes(language)}
                      onChange={() => toggleLanguage(language)}
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="row-actions">
              <button className="primary-btn" disabled={busy}>
                {busy ? "Updating..." : "Save Exam Details"}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => navigate("/dashboard/manage-exams")}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </DashboardLayout>
  );
}

export default EditExamPage;
