import { Navigate, useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { studentStorage } from "../storage";

function SummaryPage() {
  const navigate = useNavigate();
  const student = studentStorage.get(studentStorage.keys.profile);
  const exam = studentStorage.get(studentStorage.keys.exam);
  const submission = studentStorage.get(studentStorage.keys.submission);

  if (!student || !exam || !submission) return <Navigate to="/" replace />;

  return (
    <PageShell title="Submission Complete" subtitle="Your attempt has been recorded successfully.">
      <section className="card narrow">
        <h2>Exam Summary</h2>
        <div className="summary-grid">
          <p>Student</p>
          <p><strong>{student.name} ({student.rollNumber})</strong></p>
          <p>Exam</p>
          <p><strong>{exam.title}</strong></p>
          <p>Answers</p>
          <p><strong>{submission.answered}/{submission.total}</strong></p>
          <p>Submitted At</p>
          <p><strong>{new Date(submission.submittedAt).toLocaleString()}</strong></p>
          <p>Status</p>
          <p><strong>{submission.auto ? "Auto Submitted" : "Submitted"}</strong></p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            studentStorage.clear();
            navigate("/", { replace: true });
          }}
        >
          Finish And Exit
        </button>
      </section>
    </PageShell>
  );
}

export default SummaryPage;
