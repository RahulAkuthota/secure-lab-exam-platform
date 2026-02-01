import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function CreateQuestion() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState({
    title: "",
    description: "",
  });

  function handleChange(e) {
    setQuestion({
      ...question,
      [e.target.name]: e.target.value,
    });
  }

  function handleNext() {
    if (!question.title || !question.description) {
      alert("Please fill all fields");
      return;
    }
    navigate("/admin/questions/testcases");
  }

  return (
    <div className="admin-page">
      <div className="question-container">
        {/* Header */}
        <div className="question-header">
          <h1>Create Question</h1>
          <p>
            Add a coding problem that students will solve during the exam.
          </p>
        </div>

        {/* Form */}
        <div className="question-form">
          <div className="form-group">
            <label>Question Title</label>
            <input
              type="text"
              name="title"
              placeholder="Eg: Two Sum Problem"
              value={question.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Problem Statement</label>
            <textarea
              name="description"
              rows={8}
              placeholder="Describe the problem, input format, output format, and constraints..."
              value={question.description}
              onChange={handleChange}
            />
          </div>

          {/* Footer Buttons */}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => navigate("/admin/dashboard")}>
              Cancel
            </button>

            <button className="btn-primary" onClick={handleNext}>
              Continue → Add Test Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateQuestion;
