import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function AttachQuestions() {
  const navigate = useNavigate();

  // UI-only mock questions
  const questions = [
    { id: 1, title: "Two Sum Problem" },
    { id: 2, title: "Reverse a String" },
    { id: 3, title: "Maximum Element in Array" },
    { id: 4, title: "Palindrome Check" },
  ];

  const [selected, setSelected] = useState([]);

  function toggleQuestion(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((q) => q !== id)
        : [...prev, id]
    );
  }

  return (
    <div className="admin-page">
      <div className="attach-container">
        {/* Header */}
        <div className="question-header">
          <h1>Attach Questions to Exam</h1>
          <p>Select the questions to be included in this exam</p>
        </div>

        {/* Selected Info */}
        <div className="selection-info">
          Selected Questions: <strong>{selected.length}</strong>
        </div>

        {/* Question List */}
        <div className="attach-list">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`attach-card ${
                selected.includes(q.id) ? "selected" : ""
              }`}
              onClick={() => toggleQuestion(q.id)}
            >
              <input
                type="checkbox"
                checked={selected.includes(q.id)}
                readOnly
              />
              <span>{q.title}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/admin/dashboard")}
          >
            Cancel
          </button>

          <button
            className="btn-primary"
            disabled={selected.length === 0}
            onClick={() => navigate("/admin/exam/summary")
        }
          >
            Save Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttachQuestions;
