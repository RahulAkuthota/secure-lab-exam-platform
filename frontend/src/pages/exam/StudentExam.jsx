import { Navigate } from "react-router-dom";
import { useStudent } from "../../context/StudentContext";
import Header from "../../components/common/Header";
import CodeEditor from "../../components/exam/CodeEditor";
import TestCasePanel from "../../components/exam/TestCasePanel";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchExam } from "../../services/exam.service";
import { submitCode } from "../../services/submission.service";
import useTimer from "../../hooks/useTimer";
import LanguageSelector from "../../components/exam/LanguageSelector";
import useFullscreen from "../../hooks/useFullscreen";
import useTabSwitchDetection from "../../hooks/useTabSwitchDetection";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "secure_exam_state_v1";

function StudentExam() {
  const navigate = useNavigate();
  const { student, setStudent } = useStudent();
  
  const examStartTimeRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const hasTimerStartedRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const isSystemActionRef = useRef(false);
  const stateRef = useRef({ answers: {}, currentIndex: 0, violations: 0 });
  const initializationSafetyRef = useRef(false);

  const [exam, setExam] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leftWidth, setLeftWidth] = useState(40);
  const [answers, setAnswers] = useState({});
  const [languagesMap, setLanguagesMap] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [examSubmitted, setExamSubmitted] = useState(false);

  useEffect(() => {
    stateRef.current = { answers, currentIndex, violations };
  }, [answers, currentIndex, violations]);

  /* ================= FETCH & INITIALIZE ================= */
  useEffect(() => {
    fetchExam().then((data) => {
      if (!data) return;
      setExam(data);
      
      const saved = localStorage.getItem(STORAGE_KEY);
      let restoredStartTime = null;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const totalDurationMs = data.durationMinutes * 60 * 1000;
          if (parsed.examStartTime && (now - parsed.examStartTime) < totalDurationMs) {
            setAnswers(parsed.answers || {});
            setCurrentIndex(parsed.currentIndex ?? 0);
            setViolations(parsed.violations ?? 0);
            restoredStartTime = parsed.examStartTime;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) { console.error(e); }
      }
      
      examStartTimeRef.current = restoredStartTime || Date.now();
      setTimerStarted(true);
      setTimeout(() => {
        initializationSafetyRef.current = true;
        hasTimerStartedRef.current = true;
      }, 3000);
    });
  }, []);

  const time = useTimer(timerStarted ? (exam?.durationMinutes || 0) * 60 : 0);

  /* ================= RUN CODE LOGIC ================= */
  const handleRun = async () => {
    if (examSubmitted || loading) return;
    const currentQ = exam.questions[currentIndex];
    
    isSystemActionRef.current = true;
    setLoading(true);
    try {
      const result = await submitCode({
        code: answers[currentQ.id] || "",
        language: languagesMap[currentQ.id] || exam.allowedLanguages?.[0],
        question: currentQ
      });
      setSubmissionResult(result);
    } catch (err) {
      console.error("Run failed", err);
    } finally {
      setLoading(false);
      setTimeout(() => { isSystemActionRef.current = false; }, 300);
    }
  };

  /* ================= SUBMIT LOGIC ================= */
  const handleSubmit = useCallback(async (isAuto = false) => {
    if (examSubmitted || (isAuto && !initializationSafetyRef.current)) return;
    if (autoSubmittedRef.current && !isAuto) return;
  
    isSystemActionRef.current = true;
    if (isAuto) autoSubmittedRef.current = true;
    setLoading(true);
  
    try {
      const currentQ = exam.questions[stateRef.current.currentIndex];
      await submitCode({
        code: stateRef.current.answers[currentQ.id] || "",
        language: languagesMap[currentQ.id] || exam.allowedLanguages?.[0],
        question: currentQ
      });
  
      setExamSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
      setStudent(prev => ({ ...prev, examStatus: isAuto ? "AUTO_SUBMITTED" : "SUBMITTED", violations: stateRef.current.violations }));
      setWarningMessage(isAuto ? "⏱ Time Up! Auto-submitted." : "✅ Submitted successfully.");
      setTimeout(() => navigate("/exam-summary"), 1500);
    } catch (err) { console.error(err); } finally {
      setLoading(false);
      setTimeout(() => { isSystemActionRef.current = false; }, 300);
    }
  }, [exam, languagesMap, examSubmitted, navigate, setStudent]);

  useEffect(() => {
    if (timerStarted && initializationSafetyRef.current && time === 0 && !examSubmitted) {
        handleSubmit(true);
    }
  }, [time, examSubmitted, timerStarted, handleSubmit]);

  /* ================= RESIZER LOGIC ================= */
  const startResizing = (e) => {
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftWidth(newWidth);
    }
  };

  const stopResizing = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  };

  /* ================= ANTI-CHEAT ================= */
  const handleViolation = useCallback(() => {
    if (examSubmitted || isSystemActionRef.current || autoSubmittedRef.current) return;
    setViolations((v) => {
      const next = v + 1;
      if (next >= 3) { handleSubmit(true); } 
      else { setWarningMessage(`⚠️ Warning ${next}/2: Keep focus!`); }
      return next;
    });
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  }, [examSubmitted, handleSubmit]);

  useFullscreen(timerStarted && !examSubmitted, handleViolation);
  useTabSwitchDetection(examSubmitted ? () => {} : handleViolation);

  useEffect(() => {
    if (!exam || !exam.questions?.[currentIndex]) return;
    const q = exam.questions[currentIndex];
    setAnswers(p => ({ ...p, [q.id]: p[q.id] ?? "// write code here" }));
    setLanguagesMap(p => ({ ...p, [q.id]: p[q.id] ?? exam.allowedLanguages?.[0] }));
    setSubmissionResult(null);
  }, [exam, currentIndex]);

  if (!student) return <Navigate to="/login" />;
  if (!exam) return <div style={styles.loading}>Loading Exam...</div>;

  const currentQuestion = exam.questions[currentIndex];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header time={time} />
      {examSubmitted && <div style={styles.successBanner}>✅ Exam Submitted</div>}
      {!examSubmitted && warningMessage && <div style={styles.warningBanner}>{warningMessage}</div>}

      <div ref={containerRef} style={styles.body}>
        {/* LEFT PANEL */}
        <div style={{ ...styles.leftPanel, width: `${leftWidth}%` }}>
          <span style={styles.questionLabel}>Question {currentIndex + 1} of {exam.questions.length}</span>
          <h2 style={styles.questionTitle}>{currentQuestion?.title}</h2>
          <p style={styles.questionDesc}>{currentQuestion?.description}</p>
          
          <div style={styles.exampleSection}>
            <div style={styles.exampleHeader}>Sample Input</div>
            <pre style={styles.preBlock}>{currentQuestion?.sampleInput}</pre>
            <div style={styles.exampleHeader}>Sample Output</div>
            <pre style={styles.preBlock}>{currentQuestion?.sampleOutput}</pre>
          </div>

          <div style={styles.navButtons}>
            <button style={styles.secondaryBtn} disabled={currentIndex === 0 || examSubmitted} onClick={() => setCurrentIndex(i => i - 1)}>Previous</button>
            <button style={styles.secondaryBtn} disabled={currentIndex === exam.questions.length - 1 || examSubmitted} onClick={() => setCurrentIndex(i => i + 1)}>Next</button>
          </div>
        </div>

        {/* RESIZER BAR */}
        <div style={styles.resizer} onMouseDown={startResizing} />

        {/* RIGHT PANEL */}
        <div style={{ ...styles.rightPanel, width: `${100 - leftWidth}%` }}>
          <div style={styles.topBar}>
            <LanguageSelector languages={exam.allowedLanguages} value={languagesMap[currentQuestion?.id]} onChange={(l) => setLanguagesMap(p => ({ ...p, [currentQuestion.id]: l }))} />
          </div>
          <div style={styles.editorWrapper}>
            <CodeEditor code={answers[currentQuestion?.id]} onChange={(v) => setAnswers(p => ({ ...p, [currentQuestion.id]: v }))} language={languagesMap[currentQuestion?.id]} readOnly={examSubmitted} />
          </div>
          
          {/* THE NEW RESULT PANEL */}
          {submissionResult && (
            <div style={styles.resultContainer}>
              <div style={styles.resultHeader}>
                <span>Test Results</span>
                <button onClick={() => setSubmissionResult(null)} style={styles.closeResultBtn}>✕</button>
              </div>
              <div style={styles.resultBody}>
                <TestCasePanel results={submissionResult.results} />
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button style={styles.runBtn} onClick={handleRun} disabled={loading || examSubmitted}>
              {loading ? "Running..." : "Run Code"}
            </button>
            <button style={styles.submitBtn} onClick={() => { if(window.confirm("Submit exam?")) handleSubmit(false); }} disabled={loading || examSubmitted}>
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentExam;

const styles = {
  loading: { padding: "50px", textAlign: "center", fontStyle: "italic" },
  body: { flex: 1, display: "flex", overflow: "hidden", background: "#f8fafc" },
  leftPanel: { padding: "24px", overflowY: "auto", background: "#fff", borderRight: "1px solid #e2e8f0" },
  rightPanel: { display: "flex", flexDirection: "column", background: "#fff", position: "relative" },
  resizer: { width: "8px", cursor: "col-resize", background: "#f1f5f9", borderLeft: "1px solid #cbd5e1", transition: "background 0.2s" },
  editorWrapper: { flex: 1, minHeight: 0 },
  topBar: { height: "48px", background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #e2e8f0" },
  
  // New Result Panel Styles
  resultContainer: { height: "220px", background: "#fff", borderTop: "2px solid #e2e8f0", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" },
  resultHeader: { padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "600", color: "#64748b", fontSize: "14px" },
  resultBody: { flex: 1, overflowY: "auto", padding: "12px" },
  closeResultBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px" },

  actions: { height: "60px", background: "#fff", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", padding: "0 16px", borderTop: "1px solid #e2e8f0" },
  runBtn: { padding: "8px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: "500", color: "#334155" },
  submitBtn: { padding: "8px 22px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  secondaryBtn: { padding: "8px 16px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" },
  
  questionLabel: { color: "#2563eb", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  questionTitle: { margin: "12px 0", fontSize: "22px", color: "#1e293b" },
  questionDesc: { lineHeight: "1.6", color: "#475569", marginBottom: "24px" },
  exampleSection: { background: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #f1f5f9" },
  exampleHeader: { fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" },
  preBlock: { background: "#1e293b", color: "#fff", padding: "12px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px", overflowX: "auto" },
  navButtons: { marginTop: "30px", display: "flex", gap: "12px" },
  warningBanner: { background: "#fee2e2", color: "#b91c1c", padding: "10px", textAlign: "center", fontWeight: "600" },
  successBanner: { background: "#15803d", color: "#fff", padding: "10px", textAlign: "center", fontWeight: "600" }
};