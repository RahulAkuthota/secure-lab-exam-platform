import { useStudent } from "../../context/StudentContext";
import { Navigate } from "react-router-dom";

function ExamSummary() {
  const { student } = useStudent();

  if (!student) return <Navigate to="/login" />;

  // Mock summary data (later can come from backend)
  const summary = {
    status: student.examStatus || "SUBMITTED",
    violations: student.violations ?? 0,
    submittedAt: new Date().toLocaleString()
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Exam Submission Summary</h2>

        <div style={styles.row}>
          <span>Student Name</span>
          <strong>{student.name}</strong>
        </div>

        <div style={styles.row}>
          <span>Student ID</span>
          <strong>{student.studentId}</strong>
        </div>

        <div style={styles.row}>
          <span>Class</span>
          <strong>{student.className}</strong>
        </div>

        <div style={styles.row}>
          <span>Status</span>
          <strong
            style={{
              color:
                summary.status === "AUTO_SUBMITTED" ? "#b91c1c" : "#15803d"
            }}
          >
            {summary.status}
          </strong>
        </div>

        <div style={styles.row}>
          <span>Violations</span>
          <strong>{summary.violations}</strong>
        </div>

        <div style={styles.row}>
          <span>Submitted At</span>
          <strong>{summary.submittedAt}</strong>
        </div>

        <p style={styles.note}>
          ✅ Your exam has been successfully submitted.  
          You may now close this browser window.
        </p>
      </div>
    </div>
  );
}

export default ExamSummary;

/* ---------- STYLES ---------- */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a"
  },
  card: {
    background: "#ffffff",
    padding: "30px",
    width: "100%",
    maxWidth: "450px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#1e293b"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px"
  },
  note: {
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
    color: "#334155"
  }
};
