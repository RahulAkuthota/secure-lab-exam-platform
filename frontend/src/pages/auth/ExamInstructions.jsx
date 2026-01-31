import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStudent } from "../../context/StudentContext";

function ExamInstructions() {
  const navigate = useNavigate();
  const { student } = useStudent();
  const [agreed, setAgreed] = useState(false);

  if (!student) {
    navigate("/login");
    return null;
  }

  function handleStartExam() {
    if (!agreed) {
      alert("Please agree to the instructions before starting the exam.");
      return;
    }
    navigate("/exam");
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Exam Instructions</h2>

        <div style={styles.studentBox}>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Student ID:</strong> {student.studentId}</p>
          <p><strong>Class:</strong> {student.className}</p>
        </div>

        <ul style={styles.list}>
          <li>The exam is time-bound. Once started, the timer cannot be paused.</li>
          <li>All code submissions will be evaluated on the server.</li>
          <li>Do not refresh or close the browser during the exam.</li>
          <li>Switching tabs or leaving fullscreen may result in auto-submission.</li>
          <li>Once the time ends, your latest code will be auto-submitted.</li>
          <li>No external help or internet access is allowed.</li>
        </ul>

        <div style={styles.checkbox}>
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="agree">
            I have read and understood the exam instructions
          </label>
        </div>

        <button
          style={{
            ...styles.button,
            backgroundColor: agreed ? "#2563eb" : "#94a3b8",
            cursor: agreed ? "pointer" : "not-allowed"
          }}
          onClick={handleStartExam}
        >
          Start Exam
        </button>
      </div>
    </div>
  );
}

export default ExamInstructions;

/* ---------- styles ---------- */

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    width: "100%",
    maxWidth: "650px",
    background: "#ffffff",
    padding: "32px",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },
  title: {
    marginBottom: "20px",
    textAlign: "center",
    color: "#1e293b"
  },
  studentBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  list: {
    marginBottom: "20px",
    paddingLeft: "20px",
    lineHeight: "1.7",
    fontSize: "14px",
    color: "#334155"
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  button: {
    width: "100%",
    padding: "12px",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "bold"
  }
};
