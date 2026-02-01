import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function ExamSummaryAdmin() {
  const navigate = useNavigate();

  // UI-only mock data (later comes from backend)
  const exam = {
    title: "Data Structures Lab Test",
    duration: 90,
    instructions: [
      "Do not switch tabs",
      "Do not refresh the page",
      "Exam auto-submits when time ends",
      "Any malpractice leads to disqualification",
    ],
    questions: [
      "Two Sum Problem",
      "Reverse a String",
      "Maximum Element in Array",
    ],
  };

  return (
    <div className="admin-page">
      <div className="summary-container">
        {/* Header */}
        <div className="question-header">
          <h1>Review Exam Summary</h1>
          <p>Verify all details before starting the exam</p>
        </div>

        {/* Exam Info */}
        <div className="summary-card">
          <h3>Exam Details</h3>

          <div className="summary-row">
            <span>Exam Title</span>
            <strong>{exam.title}</strong>
          </div>

          <div className="summary-row">
            <span>Total Duration</span>
            <strong>{exam.duration} minutes</strong>
          </div>
        </div>

        {/* Instructions */}
        <div className="summary-card">
          <h3>Student Instructions</h3>
          <ul className="instruction-list">
            {exam.instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>

        {/* Questions */}
        <div className="summary-card">
          <h3>Attached Questions</h3>
          <ol className="question-list">
            {exam.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/admin/exam/settings")}
          >
            ← Edit Exam
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/admin/exam/control")
        }
          >
            ▶ Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamSummaryAdmin;
