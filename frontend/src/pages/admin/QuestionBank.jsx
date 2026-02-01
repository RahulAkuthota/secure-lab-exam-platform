import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function QuestionBank() {
  const navigate = useNavigate();

  // UI-only mock data
  const questions = [
    {
      id: 1,
      title: "Two Sum Problem",
      description: "Find two numbers that add up to a target value.",
    },
    {
      id: 2,
      title: "Reverse a String",
      description: "Reverse the given string without using built-in functions.",
    },
    {
      id: 3,
      title: "Find Maximum Element",
      description: "Find the maximum element in an array.",
    },
  ];

  return (
    <div className="admin-page">
      <div className="questionbank-container">
        {/* Header */}
        <div className="question-header">
          <h1>Question Bank</h1>
          <p>Manage all coding questions created by faculty</p>
        </div>

        {/* Top Actions */}
        <div className="questionbank-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/admin/questions/create")}
          >
            ➕ Create New Question
          </button>
        </div>

        {/* Question List */}
        <div className="question-list">
          {questions.map((q) => (
            <div key={q.id} className="question-card">
              <div className="question-info">
                <h3>{q.title}</h3>
                <p>{q.description}</p>
              </div>

              <div className="question-actions">
                <button
                  className="btn-secondary"
                  onClick={() => navigate("/admin/questions/testcases")}
                >
                  View Test Cases
                </button>

                <button className="btn-secondary">Edit</button>
                <button className="btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuestionBank;
