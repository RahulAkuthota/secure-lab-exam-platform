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
  const [viewMode, setViewMode] = useState("detailed"); // 'detailed', 'summary', or 'final'
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [examResultsStatus, setExamResultsStatus] = useState("NotComputed");
  const [resultExamTitle, setResultExamTitle] = useState("");

  // Override Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    studentId: "",
    studentName: "",
    questionIndex: 0,
    oldScore: 0,
    newScore: 0,
    reason: "",
  });

  const selectedExam = useMemo(
    () => exams.find((e) => e._id === selectedExamId),
    [selectedExamId, exams]
  );

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0]._id);
    }
  }, [selectedExamId, exams]);

  const loadResults = async () => {
    if (!selectedExamId) {
      setResultRows([]);
      setSummaryRows([]);
      setFinalResults([]);
      setResultExamTitle("");
      return;
    }

    setResultsLoading(true);
    try {
      if (viewMode === "detailed") {
        const data = await facultyApi.getExamResults(token, selectedExamId, submissionType);
        setResultRows(Array.isArray(data.results) ? data.results : []);
        setResultExamTitle(data.exam?.title || "");
        setExamResultsStatus(data.exam?.resultsStatus || "Preliminary");
      } else if (viewMode === "summary") {
        const data = await facultyApi.getAggregatedExamResults(token, selectedExamId, submissionType);
        setSummaryRows(Array.isArray(data.results) ? data.results : []);
        setResultExamTitle(data.exam?.title || "");
        setExamResultsStatus(data.exam?.resultsStatus || "Preliminary");
      } else if (viewMode === "final") {
        const data = await facultyApi.getFinalResults(token, selectedExamId);
        setFinalResults(Array.isArray(data.results) ? data.results : []);
        setResultExamTitle(data.exam?.title || "");
        setExamResultsStatus(data.exam?.resultsStatus || "Finalized");
      }
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("This will freeze the current best scores for all students. Proceed?")) return;
    setResultsLoading(true);
    try {
      await facultyApi.finalizeResults(token, selectedExamId);
      pushToast("success", "Results finalized successfully.");
      setViewMode("final");
      await loadResults();
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Publishing will make results visible and immutable. Proceed?")) return;
    setResultsLoading(true);
    try {
      await facultyApi.publishResults(token, selectedExamId);
      pushToast("success", "Results published successfully.");
      await loadResults();
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  const downloadFinalCsv = () => {
    const url = `${import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`}/faculty/exams/${selectedExamId}/download-final-csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `final_results_${selectedExamId}.csv`);
    // Need to handle auth token for direct download? Usually easier via window.open if cookies or just download via blobbing if needed.
    // Let's use fetch for better auth handling
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `final_results_${resultExamTitle.replace(/\s+/g, "_")}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => pushToast("error", "Failed to download CSV"));
  };

  const downloadCsv = () => {
    if (viewMode === "final") {
      downloadFinalCsv();
      return;
    }
    const dataToExport = viewMode === "detailed" ? resultRows : summaryRows;
    if (dataToExport.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    if (viewMode === "detailed") {
      csvContent += "Roll Number,Name,Question,Language,Status,Score %,Passed,Exec Time (ms),Timestamp\n";
      dataToExport.forEach((row) => {
        csvContent += `${row.rollNumber},${row.studentName},Q${Number(row.questionIndex) + 1},${row.language || "-"
          },${row.status},${row.scorePercent},${row.passedCases}/${row.totalCases},${row.executionTime
          },${row.timestamp}\n`;
      });
    } else {
      const maxQuestions = Math.max(...summaryRows.map((r) => r.questions.length), 0);
      let header = "Roll Number,Name";
      for (let i = 1; i <= maxQuestions; i++) header += `,Q${i} %`;
      header += ",Total %,Status,Submitted At\n";
      csvContent += header;

      dataToExport.forEach((row) => {
        let line = `${row.rollNumber},${row.studentName}`;
        for (let i = 0; i < maxQuestions; i++) {
          const q = row.questions.find((q) => q.questionIndex === i);
          line += `,${q ? Math.round((q.passedCases / q.totalCases) * 100) : "-"}`;
        }
        line += `,${row.scorePercent},${row.isFinalSubmitted ? "Submitted" : "Pending"},${row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"
          }\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `results_${resultExamTitle.replace(/\s+/g, "_")}_${viewMode}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openOverride = (row, qIndex) => {
    const qRes = row.questionResults.find(qr => qr.questionIndex === qIndex);
    setOverrideData({
      studentId: row.studentId,
      studentName: row.studentName,
      questionIndex: qIndex,
      oldScore: qRes.score,
      newScore: qRes.score,
      reason: ""
    });
    setShowOverrideModal(true);
  };

  const submitOverride = async () => {
    if (!overrideData.reason.trim()) {
      pushToast("error", "Reason for adjustment is required.");
      return;
    }
    setResultsLoading(true);
    try {
      await facultyApi.overrideScore(token, {
        examId: selectedExamId,
        studentId: overrideData.studentId,
        questionIndex: overrideData.questionIndex,
        newScore: overrideData.newScore,
        reason: overrideData.reason
      });
      pushToast("success", "Score updated and audit logged.");
      setShowOverrideModal(false);
      await loadResults();
    } catch (err) {
      pushToast("error", err.message);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      loadResults();
    }
  }, [selectedExamId, submissionType, viewMode]);

  const stats = useMemo(() => {
    if (viewMode === "detailed") {
      const total = resultRows.length;
      const passed = resultRows.filter((row) => row.status === "Passed").length;
      const failed = resultRows.filter((row) => row.status === "Failed").length;
      const errored = resultRows.filter((row) => row.status === "Error").length;
      return { total, passed, failed, errored };
    } else if (viewMode === "summary") {
      const total = summaryRows.length;
      const completed = summaryRows.filter((row) => row.isFinalSubmitted).length;
      const pending = total - completed;
      return { total, completed, pending };
    } else {
      const total = finalResults.length;
      const avgScore = total > 0 ? Math.round(finalResults.reduce((acc, r) => acc + r.scorePercent, 0) / total) : 0;
      return { total, avgScore };
    }
  }, [resultRows, summaryRows, finalResults, viewMode]);

  return (
    <DashboardLayout
      title="Results"
      subtitle="Review latest coding outcomes and finalize for student credits."
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
            View Mode
            <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
              <option value="detailed">Live: Detailed (Per Question)</option>
              <option value="summary">Live: Summary (Per Student)</option>
              <option value="final">Credit-Ready: Finalized Results</option>
            </select>
          </label>
          {viewMode !== "final" && (
            <label>
              Submission Type
              <select value={submissionType} onChange={(event) => setSubmissionType(event.target.value)}>
                <option value="private">Private (Credits)</option>
                <option value="public">Public (Reference)</option>
              </select>
            </label>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button
              className="primary-btn"
              onClick={downloadCsv}
              disabled={
                viewMode === "detailed" ? resultRows.length === 0 : viewMode === "summary" ? summaryRows.length === 0 : finalResults.length === 0
              }
            >
              Download {viewMode === "final" ? "Official" : ""} CSV
            </button>
          </div>
        </div>

        <div className="results-stats-grid">
          <div className="results-stat-card">
            <p>Total {viewMode === "detailed" ? "Rows" : "Students"}</p>
            <strong>{stats.total}</strong>
          </div>
          {viewMode === "detailed" ? (
            <>
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
            </>
          ) : viewMode === "summary" ? (
            <>
              <div className="results-stat-card passed">
                <p>Final Submitted</p>
                <strong>{stats.completed}</strong>
              </div>
              <div className="results-stat-card error">
                <p>In Progress</p>
                <strong>{stats.pending}</strong>
              </div>
              <div className="results-stat-card">
                <p>Status</p>
                <span className={`chip ${examResultsStatus === 'Published' ? 'active' : 'inactive'}`}>
                  {examResultsStatus}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="results-stat-card passed">
                <p>Average Score</p>
                <strong>{stats.avgScore}%</strong>
              </div>
              <div className="results-stat-card">
                <p>Lifecycle</p>
                <span className={`chip ${examResultsStatus === 'Published' ? 'active' : 'warning'}`}>
                  {examResultsStatus}
                </span>
              </div>
            </>
          )}
        </div>

        {resultsLoading ? <div className="empty">Loading results...</div> : null}
        {!resultsLoading && selectedExamId && viewMode === "final" && finalResults.length === 0 ? (
          <div className="empty">
            Results have not been finalized for this exam yet.
            <div style={{ marginTop: '12px' }}>
              <button
                className="primary-btn"
                onClick={handleFinalize}
                disabled={selectedExam && new Date() < new Date(selectedExam.endTime)}
              >
                {selectedExam && new Date() < new Date(selectedExam.endTime) ? "Finalize (Available after Exam Ends)" : "Finalize Now"}
              </button>
            </div>
          </div>
        ) : null}

        {!resultsLoading && selectedExamId && viewMode !== "final" && resultRows.length === 0 && summaryRows.length === 0 ? (
          <div className="empty">No {submissionType} results available for this exam.</div>
        ) : null}

        {!resultsLoading && (
          <div className="results-table-wrap">
            <table className="results-table">
              {viewMode === "detailed" && resultRows.length > 0 && (
                <>
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
                          <span className={`chip ${row.status === "Passed" ? "active" : row.status === "Failed" ? "inactive" : ""}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.scorePercent}%</td>
                        <td>{row.passedCases}/{row.totalCases}</td>
                        <td>{row.executionTime} ms</td>
                        <td>{row.failedCaseNumber ? `#${row.failedCaseNumber}` : "-"}</td>
                        <td>{row.timestamp ? new Date(row.timestamp).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {viewMode === "summary" && summaryRows.length > 0 && (
                <>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      {Array.from({ length: Math.max(...summaryRows.map((r) => r.questions.length), 0) }, (_, i) => (
                        <th key={`q-head-${i}`}>Q{i + 1} %</th>
                      ))}
                      <th>Total Score</th>
                      <th>Exam Status</th>
                      <th>Violations</th>
                      <th>Final Submission At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.studentId}>
                        <td>{row.rollNumber}</td>
                        <td>{row.studentName}</td>
                        {Array.from({ length: Math.max(...summaryRows.map((r) => r.questions.length), 0) }, (_, i) => {
                          const q = row.questions.find((q) => q.questionIndex === i);
                          return (
                            <td key={`q-cell-${row.studentId}-${i}`}>
                              {q ? `${Math.round((q.passedCases / q.totalCases) * 100)}%` : "-"}
                            </td>
                          );
                        })}
                        <td><strong>{row.scorePercent}%</strong></td>
                        <td>
                          <span className={`chip ${row.isFinalSubmitted ? "active" : "inactive"}`}>
                            {row.isFinalSubmitted ? "Submitted" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <span className={`chip ${row.violationCount > 0 ? "inactive" : ""}`}>
                            {row.violationCount}
                          </span>
                        </td>
                        <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {viewMode === "final" && finalResults.length > 0 && (
                <>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      {Array.from({ length: Math.max(...finalResults.map((r) => r.questionResults.length), 0) }, (_, i) => (
                        <th key={`fq-head-${i}`}>Q{i + 1} Marks</th>
                      ))}
                      <th>Total Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalResults.map((row) => (
                      <tr key={row._id}>
                        <td>{row.rollNumber}</td>
                        <td>{row.studentName}</td>
                        {Array.from({ length: Math.max(...finalResults.map((r) => r.questionResults.length), 0) }, (_, i) => {
                          const q = row.questionResults.find((qr) => qr.questionIndex === i);
                          return (
                            <td key={`fq-cell-${row._id}-${i}`}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {q ? `${q.score}/${q.totalPossible}` : "-"}
                                {q && q.manualAdjustment !== 0 && (
                                  <span className="lang-chip" title={`Adj: ${q.manualAdjustment} (${q.adjustmentNote})`}>
                                    {q.manualAdjustment > 0 ? `+${q.manualAdjustment}` : q.manualAdjustment}
                                  </span>
                                )}
                                {q && examResultsStatus !== "Published" && (
                                  <button onClick={() => openOverride(row, i)} className="ghost-btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>Edit</button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td><strong>{row.totalScore}/{row.totalPossible} ({row.scorePercent}%)</strong></td>
                        <td>
                          <span className={`chip ${row.status === "Published" ? "active" : "warning"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>-</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}

        {viewMode === "final" && finalResults.length > 0 && (
          <div className="action-bar">
            {examResultsStatus === "Finalized" && (
              <button className="primary-btn" onClick={handlePublish}>Publish to Students</button>
            )}
            <button className="ghost-btn" onClick={handleFinalize}>Re-Finalize (Refresh Snapshot)</button>
          </div>
        )}
      </section>

      {showOverrideModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <h2>Override Score</h2>
            <p className="meta">Student: <strong>{overrideData.studentName}</strong> (Q{overrideData.questionIndex + 1})</p>
            <div className="form-grid">
              <label>
                Raw Score (Passed Test Cases)
                <input type="number" value={overrideData.oldScore} disabled />
              </label>
              <label>
                New Adjusted Score
                <input
                  type="number"
                  value={overrideData.newScore}
                  onChange={(e) => setOverrideData({ ...overrideData, newScore: e.target.value })}
                />
              </label>
              <label>
                Reason for Adjustment
                <textarea
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  placeholder="e.g. Partial marks for logic, manual evaluation..."
                />
              </label>
            </div>
            <div className="row-actions" style={{ marginTop: '12px' }}>
              <button className="primary-btn" onClick={submitOverride}>Save Changes</button>
              <button className="ghost-btn" onClick={() => setShowOverrideModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ResultsPage;
