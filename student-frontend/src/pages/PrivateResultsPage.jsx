import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { studentApi } from "../api";
import PageShell from "../layout/PageShell";
import { studentStorage } from "../storage";

const POLL_INTERVAL_MS = 1200;

function PrivateResultsPage() {
  const navigate = useNavigate();
  const token = studentStorage.get(studentStorage.keys.token);
  const student = studentStorage.get(studentStorage.keys.profile);
  const exam = studentStorage.get(studentStorage.keys.exam);
  const job = studentStorage.get(studentStorage.keys.privateResultJob);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !exam?.id || !job?.jobId) return undefined;

    let alive = true;
    let timerId = null;

    const poll = async () => {
      try {
        const response = await studentApi.getSubmitCodeResult(token, exam.id, job.jobId);
        if (!alive) return;

        if (response.pending) {
          timerId = setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        setResult(response.result || null);
        setLoading(false);
      } catch (apiError) {
        if (!alive) return;
        setLoading(false);
        setError(apiError.message || "Failed to fetch private test result.");
      }
    };

    poll();

    return () => {
      alive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [token, exam?.id, job?.jobId]);

  const evaluation = result?.evaluation || null;
  const score = useMemo(() => {
    if (!evaluation?.totalCases) return 0;
    return Math.round((evaluation.passedCases / evaluation.totalCases) * 100);
  }, [evaluation]);

  if (!token || !student || !exam) return <Navigate to="/" replace />;
  if (!job?.jobId) return <Navigate to="/exam" replace />;

  return (
    <PageShell
      title="Private Test Results"
      subtitle={`${student.name} (${student.rollNumber})`}
    >
      <section className="card private-result-shell">
        <div className="private-result-head">
          <p className="meta">Exam: {exam.title}</p>
          <p className="meta">Question: Q{Number(job.questionIndex) + 1}</p>
          <p className="meta">Job ID: {job.jobId}</p>
        </div>

        {loading ? (
          <div className="private-result-loading">
            <h2>Evaluating Private Test Cases</h2>
            <p className="meta">Please wait while your submission is being graded.</p>
          </div>
        ) : null}

        {!loading && error ? <p className="alert error">{error}</p> : null}

        {!loading && !error && result ? (
          <div className="private-result-content">
            <div className={`score-card ${evaluation?.allPassed ? "pass" : "fail"}`}>
              <p className="score-label">Score</p>
              <h2>{score}%</h2>
              <p className="meta">
                {evaluation?.passedCases || 0} / {evaluation?.totalCases || 0} test cases passed
              </p>
            </div>

            <div className="private-result-summary">
              <p>
                <strong>Status:</strong>{" "}
                {evaluation?.allPassed ? "Passed" : "Not Passed"}
              </p>
              <p>
                <strong>Execution Time:</strong> {result.executionTime || 0} ms
              </p>
              {!evaluation?.allPassed && evaluation?.failedCaseNumber ? (
                <p>
                  <strong>First Failed Case:</strong> Test Case #{evaluation.failedCaseNumber}
                </p>
              ) : null}
            </div>

            {Array.isArray(evaluation?.cases) && evaluation.cases.length > 0 ? (
              <div className="case-status-list">
                {evaluation.cases.map((testCase) => (
                  <div
                    key={`private-case-${testCase.caseNumber}`}
                    className={`case-status-item ${testCase.passed ? "pass" : "fail"}`}
                  >
                    <p>
                      <strong>Test Case #{testCase.caseNumber}</strong> - {testCase.status}
                    </p>
                    <p className="meta">Execution Time: {testCase.executionTime || 0} ms</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="action-row">
          <button
            className="ghost-btn"
            onClick={() => {
              studentStorage.set(studentStorage.keys.privateResultJob, null);
              navigate("/exam");
            }}
          >
            Continue Coding
          </button>
        </div>
      </section>
    </PageShell>
  );
}

export default PrivateResultsPage;
