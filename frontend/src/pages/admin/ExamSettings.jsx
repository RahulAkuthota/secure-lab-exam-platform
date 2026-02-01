import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function ExamSettings() {
  const navigate = useNavigate();

  const [exam, setExam] = useState({
    title: "",
    duration: 60, // minutes
    instructions: "",
  });

  function handleChange(e) {
    setExam({
      ...exam,
      [e.target.name]: e.target.value,
    });
  }

  function handleNext() {
    if (!exam.title || !exam.instructions) {
      alert("Please fill all fields");
      return;
    }

    navigate("/admin/exam/attach-questions");
  }

  return (
    <div className="admin-page">
      <div className="exam-container">
        {/* Header */}
        <div className="question-header">
          <h1>Exam Settings</h1>
          <p>Configure exam duration and student instructions</p>
        </div>

        {/* Form Card */}
        <div className="exam-card">
          <div className="form-group">
            <label>Exam Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Data Structures Lab Test"
              value={exam.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Total Exam Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              min="10"
              max="300"
              value={exam.duration}
              onChange={handleChange}
            />
            <small className="hint">
              This is a global timer for the entire exam
            </small>
          </div>

          <div className="form-group">
            <label>Exam Instructions</label>
            <textarea
              name="instructions"
              rows={6}
              placeholder={`Example:
• Do not switch tabs
• Do not refresh the page
• All questions must be attempted
• Exam auto-submits when time ends`}
              value={exam.instructions}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate("/admin/dashboard")}
            >
              Cancel
            </button>

            <button className="btn-primary" onClick={handleNext}>
              Next: Attach Questions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamSettings;
