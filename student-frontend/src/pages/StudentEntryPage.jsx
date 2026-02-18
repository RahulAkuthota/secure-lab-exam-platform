import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../api";
import { studentStorage } from "../storage";
import PageShell from "../layout/PageShell";

function StudentEntryPage({ pushToast }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking backend...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [examChoices, setExamChoices] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [form, setForm] = useState({
    rollNumber: "",
    name: "",
    branch: "",
    class: "",
    examId: "",
  });

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`;

  useEffect(() => {
    studentApi
      .health()
      .then(() => setStatus("Backend reachable"))
      .catch(() => setStatus("Backend not reachable"));
  }, []);

  const submitEntry = async (overrideExamId = "") => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        rollNumber: form.rollNumber.toUpperCase().trim(),
        name: form.name.trim(),
        branch: form.branch.trim(),
        class: form.class.trim(),
        examId: (overrideExamId || form.examId).trim() || undefined,
      };
      const data = await studentApi.enter(payload);
      studentStorage.set(studentStorage.keys.token, data.token);
      studentStorage.set(studentStorage.keys.profile, data.student);
      studentStorage.set(studentStorage.keys.exam, data.exam);
      setExamChoices([]);
      setSelectedExamId("");
      pushToast("success", "Exam session created");
      navigate("/exams");
    } catch (apiError) {
      if (apiError.status === 400 && Array.isArray(apiError.data?.exams)) {
        setExamChoices(apiError.data.exams);
        setSelectedExamId(apiError.data.exams[0]?.id || "");
        setError("Multiple active exams found. Please select one.");
      } else {
        setError(apiError.message);
      }
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await submitEntry();
  };

  return (
    <PageShell
      title="Student Portal"
      subtitle="Enter your details to start a secure exam session."
    >
      <section className="card narrow">
        <h2>Enter Exam Session</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Roll Number
            <input
              required
              value={form.rollNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, rollNumber: event.target.value }))
              }
            />
          </label>
          <div className="two-cols">
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>
            <label>
              Branch
              <input
                required
                value={form.branch}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, branch: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="two-cols">
            <label>
              Class
              <input
                required
                value={form.class}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, class: event.target.value }))
                }
              />
            </label>
            <label>
              Exam ID (optional)
              <input
                value={form.examId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, examId: event.target.value }))
                }
              />
            </label>
          </div>
          <button className="primary-btn" disabled={loading}>
            {loading ? "Entering..." : "Enter"}
          </button>
        </form>

        {examChoices.length > 0 ? (
          <div className="picker-box">
            <p className="meta">Select active exam:</p>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              {examChoices.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({new Date(exam.endTime).toLocaleString()})
                </option>
              ))}
            </select>
            <button
              className="ghost-btn"
              onClick={() => submitEntry(selectedExamId)}
              disabled={loading || !selectedExamId}
            >
              Continue With Selected Exam
            </button>
          </div>
        ) : null}

        <p className="meta">API: {baseUrl}</p>
        <p className="meta">Status: {status}</p>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </PageShell>
  );
}

export default StudentEntryPage;
