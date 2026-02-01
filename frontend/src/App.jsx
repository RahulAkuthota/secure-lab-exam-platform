import { Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/auth/StudentLogin";
import ExamInstructions from "./pages/auth/ExamInstructions";
import StudentExam from "./pages/exam/StudentExam";
import "./styles/auth.css";
import ExamSummary from "./pages/exam/ExamSummary";
import AdminLogin from "./pages/auth/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import CreateQuestion from "./pages/admin/CreateQuestion";
import AddTestCases from "./pages/admin/AddTestCases";
import QuestionBank from "./pages/admin/QuestionBank";
import AttachQuestions from "./pages/admin/AttachQuestions";
import ExamSettings from "./pages/admin/ExamSettings";
import ExamSummaryAdmin from "./pages/admin/ExamSummaryAdmin";
import ExamControl from "./pages/admin/ExamControl";
import Results from "./pages/admin/Results";





function App() {
  return (
    <Routes>
      {/* student Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<StudentLogin />} />
      <Route path="/instructions" element={<ExamInstructions />} />
      <Route path="/exam" element={<StudentExam />} />
      <Route path="/exam-summary" element={<ExamSummary />} />


    {/* Faculty Routes */}
    <Route path="/admin/login" element={<AdminLogin />} />
     <Route path="/admin/dashboard" element={<Dashboard />} /> 
     <Route path="/admin/questions/create" element={<CreateQuestion />} />
     <Route path="/admin/questions/testcases" element={<AddTestCases/> }/>
     <Route path="/admin/questions" element={<QuestionBank />} />
     <Route path="/admin/exam/attach-questions" element={<AttachQuestions />} />
     <Route path="/admin/exam/settings" element={<ExamSettings />} />
     <Route path="/admin/exam/summary" element={<ExamSummaryAdmin />} />
     <Route path="/admin/exam/control" element={<ExamControl />} />
     <Route path="/admin/results" element={<Results />} />
    </Routes>
  );
}

export default App;
