import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { studentApi } from "../api";
import { studentStorage } from "../storage";
import useFullscreen from "../hooks/useFullscreen";
import SecureMonacoEditor from "../components/SecureMonacoEditor";

function useCountdown(expiresAt) {
  const [seconds, setSeconds] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setSeconds(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return seconds;
}

function formatTime(totalSeconds) {
  if (typeof totalSeconds !== "number") return "--:--";
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ExamPage({ pushToast }) {
  const navigate = useNavigate();
  const token = studentStorage.get(studentStorage.keys.token);
  const student = studentStorage.get(studentStorage.keys.profile);
  const exam = studentStorage.get(studentStorage.keys.exam);
  const questions = studentStorage.get(studentStorage.keys.questions) || [];
  const examSession = studentStorage.get(studentStorage.keys.examSession);

  const [answers, setAnswers] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [submitting, setSubmitting] = useState(false);
  const [secureReady, setSecureReady] = useState(false);
  const [fullscreenLocked, setFullscreenLocked] = useState(false);
  const [violations, setViolations] = useState(0);
  const [layoutMode, setLayoutMode] = useState("split");
  const [splitRatio, setSplitRatio] = useState(48);
  const [executionState, setExecutionState] = useState({});
  const [runningPublic, setRunningPublic] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);
  const autoSubmittedRef = useRef(false);
  const violationThrottleRef = useRef(0);
  const splitGridRef = useRef(null);
  const remainingSeconds = useCountdown(examSession?.expiresAt);
  const allowedLanguages =
    Array.isArray(exam?.allowedLanguages) && exam.allowedLanguages.length
      ? exam.allowedLanguages
      : ["python", "java", "cpp", "javascript", "c"];
  const answeredCount = useMemo(
    () => Object.values(answers).filter((item) => item?.code?.trim()).length,
    [answers]
  );

  const submitExam = async (isAuto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await studentApi.submitExam(token, {
        examId: exam.id,
        answers: Object.entries(answers).map(([questionIndex, payload]) => ({
          questionIndex: Number(questionIndex),
          selectedOption: `// language: ${payload.language || allowedLanguages[0]}\n${payload.code || ""}`,
        })),
      });
      studentStorage.set(studentStorage.keys.submission, {
        submittedAt: new Date().toISOString(),
        answered: answeredCount,
        total: questions.length,
        auto: isAuto,
      });
      pushToast("success", isAuto ? "Auto-submitted due to timer end" : "Exam submitted");
      navigate("/summary");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const registerViolation = useCallback((reason) => {
    const now = Date.now();
    if (now - violationThrottleRef.current < 800) return;
    violationThrottleRef.current = now;

    setViolations((prev) => {
      const next = prev + 1;
      pushToast("error", `${reason}. Restricted action blocked.`);
      return next;
    });
  }, [pushToast]);

  const isCodeEditorTarget = useCallback((target) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest(".code-editor-host"));
  }, []);

  const requestExamFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      setFullscreenLocked(false);
      return true;
    }

    try {
      await document.documentElement.requestFullscreen();
      setFullscreenLocked(false);
      return true;
    } catch (error) {
      setFullscreenLocked(true);
      return false;
    }
  }, []);

  useFullscreen(
    secureReady,
    useCallback(async () => {
      const ok = await requestExamFullscreen();
      if (!ok) {
        setFullscreenLocked(true);
        pushToast("error", "Please return to fullscreen to continue the exam.");
      }
    }, [pushToast, requestExamFullscreen])
  );

  useEffect(() => {
    if (!secureReady) return undefined;
    const syncFullscreenState = () => {
      setFullscreenLocked(!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [secureReady]);

  useEffect(() => {
    if (!examSession?.expiresAt || autoSubmittedRef.current) return;
    if (typeof remainingSeconds === "number" && remainingSeconds === 0) {
      autoSubmittedRef.current = true;
      submitExam(true);
    }
  }, [remainingSeconds, examSession?.expiresAt]);

  useEffect(() => {
    if (!examSession?.expiresAt) return;
    if (Number.isFinite(Number(examSession.expiresAt))) return;
    pushToast("error", "Invalid exam session timing. Please start exam again.");
    navigate("/exams", { replace: true });
  }, [examSession?.expiresAt, navigate, pushToast]);

  useEffect(() => {
    if (!secureReady) return undefined;

    const enforceReturnToFullscreen = async () => {
      setFullscreenLocked(true);
      const ok = await requestExamFullscreen();
      if (!ok) {
        pushToast("error", "Fullscreen is required. Please return to fullscreen.");
      }
    };

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const blockedCtrlKeys = ["c", "v", "x", "a", "s", "p", "u", "r", "t", "n", "w", "l", "k", "j", "o", "i"];
      const shouldBlockCtrlMeta = isCtrlOrMeta && blockedCtrlKeys.includes(key);
      const isFunctionToolKey = key === "f12";
      const isAltCombo = event.altKey;
      const isMetaKey = key === "meta";
      const inCodeEditor = isCodeEditorTarget(event.target);
      const allowedEditorShortcuts = ["c", "v", "x", "a"];
      const isPrivateSubmitShortcut = isCtrlOrMeta && key === "enter";
      const isPublicRunShortcut =
        isCtrlOrMeta && (key === "'" || key === '"' || event.code === "Quote");

      if (inCodeEditor && isPrivateSubmitShortcut) {
        event.preventDefault();
        if (!submittingCode && !submitting && !runningPublic) {
          submitCodeForPrivateTests();
        }
        return;
      }

      if (inCodeEditor && isPublicRunShortcut) {
        event.preventDefault();
        if (!runningPublic && !submitting && !submittingCode) {
          runPublicTests();
        }
        return;
      }

      if (isCtrlOrMeta && inCodeEditor && allowedEditorShortcuts.includes(key)) {
        return;
      }

      if (shouldBlockCtrlMeta || isFunctionToolKey || isAltCombo || isMetaKey) {
        event.preventDefault();
        registerViolation("Restricted keyboard shortcut detected");
      }
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      registerViolation("Right click is blocked");
    };

    const onClipboard = (event) => {
      if (isCodeEditorTarget(event.target)) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      registerViolation("Copy/paste actions are blocked");
    };

    const onDragStart = (event) => {
      event.preventDefault();
      registerViolation("Drag actions are blocked");
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        registerViolation("Exam tab lost focus");
        setFullscreenLocked(true);
      } else if (!document.fullscreenElement) {
        enforceReturnToFullscreen();
      }
    };

    const onWindowBlur = () => {
      registerViolation("Window focus changed");
      setFullscreenLocked(true);
    };

    const onWindowFocus = () => {
      if (!document.fullscreenElement) {
        enforceReturnToFullscreen();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [
    isCodeEditorTarget,
    pushToast,
    registerViolation,
    requestExamFullscreen,
    runPublicTests,
    secureReady,
    submitCodeForPrivateTests,
    runningPublic,
    submitting,
    submittingCode,
  ]);

  useEffect(() => {
    if (layoutMode !== "split") return undefined;

    const onMouseMove = (event) => {
      const grid = splitGridRef.current;
      if (!grid || !grid.dataset.resizing) return;
      const rect = grid.getBoundingClientRect();
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(70, Math.max(30, ratio));
      setSplitRatio(clamped);
    };

    const onMouseUp = () => {
      const grid = splitGridRef.current;
      if (grid?.dataset.resizing) {
        delete grid.dataset.resizing;
        document.body.classList.remove("resizing-panels");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.classList.remove("resizing-panels");
    };
  }, [layoutMode]);

  if (!student || !exam || questions.length === 0) return <Navigate to="/exams" replace />;

  const activeQuestion = questions[activeQuestionIndex];
  const activeAnswer = answers[activeQuestionIndex] || {
    code: "",
    language: allowedLanguages[0],
  };
  const activeExecution = executionState[activeQuestionIndex] || {};

  const setAnswerCode = (code) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestionIndex]: {
        ...prev[activeQuestionIndex],
        language: prev[activeQuestionIndex]?.language || allowedLanguages[0],
        code,
      },
    }));
  };

  const setAnswerLanguage = (language) => {
    setAnswers((prev) => ({
      ...prev,
      [activeQuestionIndex]: {
        ...prev[activeQuestionIndex],
        language,
        code: prev[activeQuestionIndex]?.code || "",
      },
    }));
  };

  const enterSecureMode = async () => {
    const ok = await requestExamFullscreen();
    if (ok) {
      setSecureReady(true);
      pushToast("success", "Secure exam mode is active");
    } else {
      pushToast("error", "Fullscreen permission denied. Allow fullscreen and retry.");
    }
  };

  async function runPublicTests() {
    if (!activeAnswer.code?.trim()) {
      pushToast("error", "Write code before running public test cases.");
      return;
    }
    setRunningPublic(true);
    try {
      const response = await studentApi.submitCode(token, {
        examId: exam.id,
        questionIndex: activeQuestionIndex,
        language: activeAnswer.language,
        code: activeAnswer.code,
        submissionType: "public",
      });

      setExecutionState((prev) => ({
        ...prev,
        [activeQuestionIndex]: {
          ...prev[activeQuestionIndex],
          publicChecked: true,
          publicCheckedAt: new Date().toISOString(),
          publicPending: Boolean(response.pending),
          publicJobId: response.jobId || "",
          publicStdout: response.result?.stdout || "",
          publicStderr: response.result?.stderr || "",
          publicError: response.result?.error || "",
          publicExecutionTime: response.result?.executionTime || 0,
        },
      }));
      if (response.pending) {
        const maxAttempts = 30;
        const intervalMs = 1000;
        let resolved = false;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          await sleep(intervalMs);
          const polled = await studentApi.getSubmitCodeResult(
            token,
            exam.id,
            response.jobId
          );

          if (polled.pending) continue;

          setExecutionState((prev) => ({
            ...prev,
            [activeQuestionIndex]: {
              ...prev[activeQuestionIndex],
              publicPending: false,
              publicStdout: polled.result?.stdout || "",
              publicStderr: polled.result?.stderr || "",
              publicError: polled.result?.error || "",
              publicExecutionTime: polled.result?.executionTime || 0,
            },
          }));
          resolved = true;
          break;
        }
        if (resolved) {
          pushToast("success", `Public tests completed for Q${activeQuestionIndex + 1}`);
        } else {
          pushToast("success", `Public tests queued for Q${activeQuestionIndex + 1} (${response.jobId})`);
        }
      } else {
        pushToast("success", `Public tests completed for Q${activeQuestionIndex + 1}`);
      }
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setRunningPublic(false);
    }
  }

  async function submitCodeForPrivateTests() {
    if (!activeAnswer.code?.trim()) {
      pushToast("error", "Write code before submitting to private test cases.");
      return;
    }
    setSubmittingCode(true);
    try {
      const response = await studentApi.submitCode(token, {
        examId: exam.id,
        questionIndex: activeQuestionIndex,
        language: activeAnswer.language,
        code: activeAnswer.code,
        submissionType: "private",
      });
      setExecutionState((prev) => ({
        ...prev,
        [activeQuestionIndex]: {
          ...prev[activeQuestionIndex],
          privateChecked: true,
          privateCheckedAt: new Date().toISOString(),
          privateJobId: response.jobId,
        },
      }));
      pushToast("success", `Queued private check for Q${activeQuestionIndex + 1} (${response.jobId})`);
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setSubmittingCode(false);
    }
  }

  return (
    <PageShell
      title={exam.title}
      subtitle={student.name}
      rightAction={
        <div className="exam-meta-row always-visible-meta">
          <div className="chip student-id-chip">
            <span className="chip-label">Student ID</span>
            <strong>{student.rollNumber}</strong>
          </div>
          <div className="chip timer-chip">
            <span className="chip-label">Time Left</span>
            <strong>{formatTime(remainingSeconds)}</strong>
          </div>
          <div className={`chip violation-chip ${violations > 0 ? "warn" : ""}`}>
            <span className="chip-label">Restricted Actions</span>
            <strong>{violations}</strong>
          </div>
        </div>
      }
    >
      {!secureReady ? (
        <section className="card secure-gate">
          <h2>Secure Exam Mode</h2>
          <p className="meta">
            Start secure mode to enter fullscreen and apply exam restrictions. Leaving fullscreen or switching focus
            will be blocked and forced back to fullscreen.
          </p>
          <div className="instruction-box">
            <p className="instruction-title">Exam Instructions</p>
            <ul className="instruction-list">
              <li>Restricted actions count increases when blocked actions are attempted.</li>
              <li>Allowed shortcuts inside editor: <strong>Ctrl/Cmd + C, V, X, A</strong>.</li>
              <li>Run public tests: <strong>Ctrl/Cmd + '</strong> (or <strong>Ctrl/Cmd + "</strong>).</li>
              <li>Submit to private tests: <strong>Ctrl/Cmd + Enter</strong>.</li>
              <li>Do not switch tabs/windows or exit fullscreen during exam.</li>
            </ul>
          </div>
          <button className="primary-btn" onClick={enterSecureMode}>
            Enter Secure Exam Mode
          </button>
        </section>
      ) : null}

      {secureReady ? (
        <>
        {fullscreenLocked ? (
          <section className="card secure-overlay full-lock">
            <h2>Return To Fullscreen</h2>
            <p className="meta">
              Exam is locked until fullscreen is active again.
            </p>
            <button className="primary-btn" onClick={requestExamFullscreen}>
              Re-enter Fullscreen
            </button>
          </section>
        ) : null}
        {!fullscreenLocked ? (
        <section className="leetcode-shell">
        <div className="section-head">
          <h2>Coding Assessment</h2>
          <div className="exam-header-actions">
            <span className="chip">
              Answered {answeredCount}/{questions.length}
            </span>
            <div className="layout-switch">
              <button
                className={`tab-btn ${layoutMode === "split" ? "active" : ""}`}
                onClick={() => setLayoutMode("split")}
              >
                Split
              </button>
              <button
                className={`tab-btn ${layoutMode === "question" ? "active" : ""}`}
                onClick={() => setLayoutMode("question")}
              >
                Question Full
              </button>
              <button
                className={`tab-btn ${layoutMode === "editor" ? "active" : ""}`}
                onClick={() => setLayoutMode("editor")}
              >
                Editor Full
              </button>
            </div>
          </div>
        </div>
        <div
          ref={splitGridRef}
          className={`leetcode-grid mode-${layoutMode}`}
          style={{ "--split-ratio": `${splitRatio}%` }}
        >
          <div className="problem-panel">
            <div className="question-nav-row">
              {questions.map((_, index) => (
                <button
                  key={`nav-${index}`}
                  className={`question-pill ${index === activeQuestionIndex ? "active" : ""}`}
                  onClick={() => setActiveQuestionIndex(index)}
                >
                  Q{index + 1}
                </button>
              ))}
            </div>

            <div className="tab-row">
              <button
                className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
                onClick={() => setActiveTab("description")}
              >
                Description
              </button>
              <button
                className={`tab-btn ${activeTab === "examples" ? "active" : ""}`}
                onClick={() => setActiveTab("examples")}
              >
                Public Testcases
              </button>
            </div>

            <article className="problem-card">
              <p className="q-title">
                Q{activeQuestionIndex + 1}. {activeQuestion?.title || activeQuestion?.questionText}
              </p>
              {activeTab === "description" ? (
                <p className="problem-desc">{activeQuestion?.description || "No description available."}</p>
              ) : (
                <div className="public-tests">
                  {Array.isArray(activeQuestion?.publicTestCases) &&
                  activeQuestion.publicTestCases.length > 0 ? (
                    activeQuestion.publicTestCases.map((testCase, caseIndex) => (
                      <div
                        key={`public-${activeQuestionIndex}-${caseIndex}`}
                        className="public-test-item"
                      >
                        <p>
                          <strong>Input:</strong> {testCase.input}
                        </p>
                        <p>
                          <strong>Expected:</strong> {testCase.expectedOutput}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="meta">No public test cases available.</p>
                  )}
                </div>
              )}
            </article>
          </div>

          {layoutMode === "split" ? (
            <button
              className="panel-resizer"
              type="button"
              aria-label="Resize question and editor panels"
              onMouseDown={() => {
                const grid = splitGridRef.current;
                if (grid) {
                  grid.dataset.resizing = "true";
                  document.body.classList.add("resizing-panels");
                }
              }}
            />
          ) : null}
          <div className="editor-panel">
            <div className="editor-toolbar">
              <div className="editor-heading">
                <span>Code Editor</span>
                <small>White Theme</small>
              </div>
              <select
                className="language-select"
                value={activeAnswer.language}
                onChange={(event) => setAnswerLanguage(event.target.value)}
              >
                {allowedLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
            <div className="code-editor">
              <SecureMonacoEditor
                language={activeAnswer.language}
                value={activeAnswer.code}
                onChange={setAnswerCode}
              />
            </div>
          </div>
        </div>

        <div className="action-row">
          <button
            className="ghost-btn"
            disabled={runningPublic || submitting || submittingCode}
            onClick={runPublicTests}
            title="Shortcut: Ctrl/Cmd + '"
          >
            {runningPublic ? "Running..." : "Run Public Tests (Ctrl/Cmd + ')"}
          </button>
          <button
            className="primary-btn"
            disabled={submittingCode || submitting || runningPublic}
            onClick={submitCodeForPrivateTests}
            title="Shortcut: Ctrl/Cmd + Enter"
          >
            {submittingCode ? "Submitting..." : "Submit Code (Private Tests) (Ctrl/Cmd + Enter)"}
          </button>
          <button
            className="ghost-btn"
            disabled={submitting}
            onClick={() => {
              const ok = window.confirm("Submit final answers now?");
              if (ok) submitExam(false);
            }}
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
        {activeExecution.publicChecked ? (
          <section className="execution-result">
            <div className="result-head">
              <strong>Public Run Result</strong>
              <span className="meta">
                {activeExecution.publicPending
                  ? `Queued (${activeExecution.publicJobId || "pending"})`
                  : `Execution Time: ${activeExecution.publicExecutionTime || 0} ms`}
              </span>
            </div>
            {activeExecution.publicError ? (
              <p className="alert error">{activeExecution.publicError}</p>
            ) : null}
            <div className="result-grid">
              <div className="result-block">
                <p className="meta">stdout</p>
                <pre>{activeExecution.publicStdout || "(empty)"}</pre>
              </div>
              <div className="result-block">
                <p className="meta">stderr</p>
                <pre>{activeExecution.publicStderr || "(empty)"}</pre>
              </div>
            </div>
          </section>
        ) : null}
        </section>
        ) : null}
        </>
      ) : null}
    </PageShell>
  );
}

export default ExamPage;
