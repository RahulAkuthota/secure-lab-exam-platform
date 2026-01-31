import { useState } from "react";
import { useStudent } from "../../context/StudentContext";

function Header({ time = 0 }) {
  const { student } = useStudent();
  const [showDetails, setShowDetails] = useState(false);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <header style={styles.header}>
      <div style={styles.left}>Secure Exam Platform</div>

      <div style={styles.right}>
        <div style={styles.timer}>⏱ {formatTime(time)}</div>

        <div
          style={styles.student}
          onClick={() => setShowDetails(!showDetails)}
        >
          👤 {student?.name}
        </div>

        {showDetails && (
          <div style={styles.card}>
            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>ID:</strong> {student.studentId}</p>
            <p><strong>Class:</strong> {student.className}</p>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

/* ---------- styles ---------- */

const styles = {
  header: {
    height: "60px",
    background: "#020617",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    position: "relative"
  },
  left: {
    fontWeight: "600"
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  timer: {
    fontWeight: "bold",
    color: "#facc15"
  },
  student: {
    cursor: "pointer",
    fontWeight: "600"
  },
  card: {
    position: "absolute",
    top: "60px",
    right: "20px",
    background: "#ffffff",
    color: "#020617",
    padding: "12px",
    borderRadius: "6px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
    fontSize: "14px",
    zIndex: 10
  }
};
