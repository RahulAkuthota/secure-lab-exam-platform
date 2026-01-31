import { Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/auth/StudentLogin";
import ExamInstructions from "./pages/auth/ExamInstructions";
import StudentExam from "./pages/exam/StudentExam";
import "./styles/auth.css";
import ExamSummary from "./pages/exam/ExamSummary";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<StudentLogin />} />
      <Route path="/instructions" element={<ExamInstructions />} />
      <Route path="/exam" element={<StudentExam />} />
      <Route path="/exam-summary" element={<ExamSummary />} />
    </Routes>
  );
}

export default App;
