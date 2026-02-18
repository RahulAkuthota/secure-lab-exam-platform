import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useFacultyExams } from "../utils/useFacultyExams";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";
import { createEmptyCase, createEmptyQuestion, validateQuestions } from "../utils/questionBuilder";

function QuestionEditorPage({ pushToast }) {
  const navigate = useNavigate();
  const { examId } = useParams();
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  const { exams, loading, loadExams } = useFacultyExams(pushToast);
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [loadingPaper, setLoadingPaper] = useState(true);

  const exam = useMemo(() => exams.find((item) => item._id === examId), [exams, examId]);

  useEffect(() => {
    const loadPaper = async () => {
      if (!examId) return;
      setLoadingPaper(true);
      try {
        const data = await facultyApi.getQuestionPaper(token, examId);
        setQuestions(data.questionPaper?.questions?.length ? data.questionPaper.questions : [createEmptyQuestion()]);
      } catch (apiError) {
        if (apiError.message.includes("Question paper not found")) {
          setQuestions([createEmptyQuestion()]);
          pushToast("success", "No question paper found. Start creating one.");
        } else {
          pushToast("error", apiError.message);
        }
      } finally {
        setLoadingPaper(false);
      }
    };
    loadPaper();
  }, [examId, token, pushToast]);

  const updateQuestion = (questionIndex, key, value) => {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex ? { ...question, [key]: value } : question
      )
    );
  };

  const updateCase = (questionIndex, bucket, caseIndex, key, value) => {
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        const nextCases = question[bucket].map((item, idx) =>
          idx === caseIndex ? { ...item, [key]: value } : item
        );
        return { ...question, [bucket]: nextCases };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, createEmptyQuestion()]);
  const removeQuestion = (questionIndex) =>
    setQuestions((prev) =>
      prev.length === 1 ? prev : prev.filter((_, index) => index !== questionIndex)
    );
  const addCase = (questionIndex, bucket) =>
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex
          ? { ...question, [bucket]: [...question[bucket], createEmptyCase()] }
          : question
      )
    );
  const removeCase = (questionIndex, bucket, caseIndex) =>
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;
        const min = bucket === "publicTestCases" ? 2 : 10;
        if (question[bucket].length <= min) return question;
        return {
          ...question,
          [bucket]: question[bucket].filter((_, idx) => idx !== caseIndex),
        };
      })
    );

  const saveQuestions = async () => {
    try {
      setSaving(true);
      validateQuestions(questions);
      await facultyApi.createQuestionPaper(token, { examId, questions });
      pushToast("success", "Question paper saved");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Question Editor"
      subtitle={exam ? `Exam: ${exam.title}` : "Loading exam..."}
      onRefresh={loadExams}
    >
      <section className="card">
        <div className="section-head">
          <h2>LeetCode-Style Questions</h2>
          <div className="header-actions">
            <button className="ghost-btn" onClick={() => navigate("/dashboard/manage-exams")}>
              Back To Exams
            </button>
            <button className="ghost-btn" onClick={addQuestion}>
              Add Question
            </button>
          </div>
        </div>

        {loading || loadingPaper ? <div className="empty">Loading question editor...</div> : null}
        {!loading && !loadingPaper ? (
          <div className="list">
            {questions.map((question, questionIndex) => (
              <section className="question-builder-card" key={`question-${questionIndex}`}>
                <div className="section-head">
                  <h3>Question {questionIndex + 1}</h3>
                  <button
                    className="ghost-btn danger"
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={questions.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <label>
                  Title
                  <input
                    value={question.title}
                    onChange={(event) => updateQuestion(questionIndex, "title", event.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="4"
                    value={question.description}
                    onChange={(event) =>
                      updateQuestion(questionIndex, "description", event.target.value)
                    }
                  />
                </label>

                <div className="testcases-block">
                  <div className="section-head">
                    <h4>Public Test Cases ({question.publicTestCases.length})</h4>
                    <button className="ghost-btn" onClick={() => addCase(questionIndex, "publicTestCases")}>
                      Add
                    </button>
                  </div>
                  {question.publicTestCases.map((testCase, caseIndex) => (
                    <div className="testcase-row" key={`pub-${questionIndex}-${caseIndex}`}>
                      <input
                        placeholder="Input"
                        value={testCase.input}
                        onChange={(event) =>
                          updateCase(questionIndex, "publicTestCases", caseIndex, "input", event.target.value)
                        }
                      />
                      <input
                        placeholder="Expected Output"
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          updateCase(
                            questionIndex,
                            "publicTestCases",
                            caseIndex,
                            "expectedOutput",
                            event.target.value
                          )
                        }
                      />
                      <button
                        className="ghost-btn danger"
                        onClick={() => removeCase(questionIndex, "publicTestCases", caseIndex)}
                        disabled={question.publicTestCases.length <= 2}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="testcases-block">
                  <div className="section-head">
                    <h4>Private Test Cases ({question.privateTestCases.length})</h4>
                    <button className="ghost-btn" onClick={() => addCase(questionIndex, "privateTestCases")}>
                      Add
                    </button>
                  </div>
                  {question.privateTestCases.map((testCase, caseIndex) => (
                    <div className="testcase-row" key={`pri-${questionIndex}-${caseIndex}`}>
                      <input
                        placeholder="Input"
                        value={testCase.input}
                        onChange={(event) =>
                          updateCase(
                            questionIndex,
                            "privateTestCases",
                            caseIndex,
                            "input",
                            event.target.value
                          )
                        }
                      />
                      <input
                        placeholder="Expected Output"
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          updateCase(
                            questionIndex,
                            "privateTestCases",
                            caseIndex,
                            "expectedOutput",
                            event.target.value
                          )
                        }
                      />
                      <button
                        className="ghost-btn danger"
                        onClick={() => removeCase(questionIndex, "privateTestCases", caseIndex)}
                        disabled={question.privateTestCases.length <= 10}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        <div className="section-head">
          <p className="meta">Mandatory: 2 public and 10 private test cases per question.</p>
          <button className="primary-btn" onClick={saveQuestions} disabled={saving}>
            {saving ? "Saving..." : "Save Question Paper"}
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default QuestionEditorPage;
