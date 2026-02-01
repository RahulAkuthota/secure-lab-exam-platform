import { useState } from "react";
import "../../styles/admin.css";

function ExamControl() {
  const [status, setStatus] = useState("NOT_STARTED");

  function startExam() {
    setStatus("RUNNING");
  }

  function endExam() {
    setStatus("ENDED");
  }

  return (
    <div className="admin-page">
      <div className="control-container">
        {/* Header */}
        <div className="question-header">
          <h1>Exam Control Panel</h1>
          <p>Manage the live status of the examination</p>
        </div>

        {/* Status Card */}
        <div className="status-card">
          <h3>Current Exam Status</h3>

          <div className={`status-badge ${status.toLowerCase()}`}>
            {status.replace("_", " ")}
          </div>

          <p className="status-desc">
            {status === "NOT_STARTED" &&
              "The exam has not started yet. Students cannot enter."}
            {status === "RUNNING" &&
              "The exam is live. Students are actively taking the exam."}
            {status === "ENDED" &&
              "The exam has ended. Submissions are locked."}
          </p>
        </div>

        {/* Controls */}
        <div className="control-actions">
          <button
            className="btn-primary"
            disabled={status !== "NOT_STARTED"}
            onClick={startExam}
          >
            ▶ Start Exam
          </button>

          <button
            className="btn-danger"
            disabled={status !== "RUNNING"}
            onClick={endExam}
          >
            ⛔ End Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamControl;
