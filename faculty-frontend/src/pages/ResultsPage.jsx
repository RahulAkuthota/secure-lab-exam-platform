import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useFacultyExams } from "../utils/useFacultyExams";
import { facultyStorage } from "../storage";
import { facultyApi } from "../api";

function ResultsPage({ pushToast }) {
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const { exams, loading: examsLoading, loadExams } = useFacultyExams(pushToast);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [submissionType, setSubmissionType] = useState("private");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [resultExamTitle, setResultExamTitle] = useState("");

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0]._id);
    }
  }, [selectedExamId, exams]);

  const loadResults = async () => {
    if (!selectedExamId) {
      setResultRows([]);
      setResultExamTitle("");
      return;
    }

    setResultsLoading(true);
    try {
      const data = await facultyApi.getExamResults(token, selectedExamId, submissionType);
      setResultRows(Array.isArray(data.results) ? data.results : []);
      setResultExamTitle(data.exam?.title || "");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      loadResults();
    }
  }, [selectedExamId, submissionType]);

  const stats = useMemo(() => {
    const total = resultRows.length;
    const passed = resultRows.filter((row) => row.status === "Passed").length;
    const failed = resultRows.filter((row) => row.status === "Failed").length;
    const errored = resultRows.filter((row) => row.status === "Error").length;
    return { total, passed, failed, errored };
  }, [resultRows]);

  return (
    <DashboardLayout
      title="Results"
      subtitle="Review latest coding outcomes for each student and question."
      onRefresh={async () => {
        await loadExams();
        await loadResults();
      }}
    >
      <section className="card">
        <div className="results-toolbar">
          <label>
            Exam
            <select
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
              disabled={examsLoading || exams.length === 0}
            >
              {exams.length === 0 ? <option value="">No exams</option> : null}
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Result Type
            <select
              value={submissionType}
              onChange={(event) => setSubmissionType(event.target.value)}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>

        <div className="results-stats-grid">
          <div className="results-stat-card">
            <p>Total Rows</p>
            <strong>{stats.total}</strong>
          </div>
          <div className="results-stat-card passed">
            <p>Passed</p>
            <strong>{stats.passed}</strong>
          </div>
          <div className="results-stat-card failed">
            <p>Failed</p>
            <strong>{stats.failed}</strong>
          </div>
          <div className="results-stat-card error">
            <p>Error</p>
            <strong>{stats.errored}</strong>
          </div>
        </div>

        {resultsLoading ? <div className="empty">Loading results...</div> : null}
        {!resultsLoading && selectedExamId && resultRows.length === 0 ? (
          <div className="empty">No {submissionType} results available for this exam.</div>
        ) : null}

        {!resultsLoading && resultRows.length > 0 ? (
          <>
            <p className="meta">
              Showing latest per student/question for <strong>{resultExamTitle || "selected exam"}</strong>.
            </p>
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Q#</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Passed</th>
                    <th>Exec Time</th>
                    <th>Failed Case</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row) => (
                    <tr key={`${row.studentId}-${row.questionIndex}-${row.submissionType}`}>
                      <td>{row.rollNumber}</td>
                      <td>{row.studentName}</td>
                      <td>{Number(row.questionIndex) + 1}</td>
                      <td>{row.language || "-"}</td>
                      <td>
                        <span
                          className={`chip ${
                            row.status === "Passed"
                              ? "active"
                              : row.status === "Failed"
                                ? "inactive"
                                : ""
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.scorePercent}%</td>
                      <td>
                        {row.passedCases}/{row.totalCases}
                      </td>
                      <td>{row.executionTime} ms</td>
                      <td>{row.failedCaseNumber ? `#${row.failedCaseNumber}` : "-"}</td>
                      <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
    </DashboardLayout>
  );
}

export default ResultsPage;
