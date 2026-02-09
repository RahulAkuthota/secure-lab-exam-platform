import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";

const LANGUAGE_OPTIONS = ["c", "cpp", "java", "python", "javascript"];

function CreateExamPage({ pushToast }) {
  const navigate = useNavigate();
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    startTime: "",
    endTime: "",
    duration: "",
    allowedLanguages: [],
  });

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

  const createExam = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await facultyApi.createExam(token, {
        title: form.title.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        duration: Number(form.duration) || undefined,
        allowedLanguages: form.allowedLanguages,
      });
      pushToast("success", "Exam created successfully");
      navigate(`/dashboard/exams/${data.exam._id}/questions`);
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout
      title="Create Exam"
      subtitle="Step 1: define exam metadata before adding questions."
    >
      <section className="card">
        <h2>Exam Details</h2>
        <form className="form-grid" onSubmit={createExam}>
          <label>
            Title
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
                required
                type="datetime-local"
                value={form.startTime}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
              />
            </label>
            <label>
              End Time
              <input
                required
                type="datetime-local"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </label>
          </div>
          <label>
            Duration (minutes, optional)
            <input
              type="number"
              min="1"
              value={form.duration}
              onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
            />
          </label>
          <div className="language-box">
            <p className="meta">
              Restrict to specific languages (optional). Leave empty for no restriction.
            </p>
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
          <button className="primary-btn" disabled={busy}>
            {busy ? "Creating..." : "Create Exam And Add Questions"}
          </button>
        </form>
      </section>
    </DashboardLayout>
  );
}

export default CreateExamPage;
