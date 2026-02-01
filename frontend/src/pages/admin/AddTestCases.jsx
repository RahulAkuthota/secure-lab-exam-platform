import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function AddTestCases() {
  const navigate = useNavigate();

  const [testCase, setTestCase] = useState({
    input: "",
    output: "",
    isPublic: true,
  });

  const [testCases, setTestCases] = useState([]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setTestCase({
      ...testCase,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  function addTestCase() {
    if (!testCase.input || !testCase.output) {
      alert("Input and Output are required");
      return;
    }

    setTestCases([...testCases, testCase]);
    setTestCase({ input: "", output: "", isPublic: true });
  }

  return (
    <div className="admin-page">
      <div className="testcase-container">
        {/* Header */}
        <div className="question-header">
          <h1>Add Test Cases</h1>
          <p>
            Add public and private test cases used for evaluation.
          </p>
        </div>

        <div className="testcase-layout">
          {/* Left: Form */}
          <div className="testcase-form">
            <div className="form-group">
              <label>Input</label>
              <textarea
                name="input"
                rows={6}
                placeholder="Enter input exactly as program receives it"
                value={testCase.input}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Expected Output</label>
              <textarea
                name="output"
                rows={4}
                placeholder="Expected output for the given input"
                value={testCase.output}
                onChange={handleChange}
              />
            </div>

            <div className="form-checkbox">
              <input
                type="checkbox"
                name="isPublic"
                checked={testCase.isPublic}
                onChange={handleChange}
              />
              <span>Public Test Case (visible to students)</span>
            </div>

            <button className="btn-primary full-width" onClick={addTestCase}>
              ➕ Add Test Case
            </button>
          </div>

          {/* Right: Preview */}
          <div className="testcase-preview">
            <h3>Added Test Cases</h3>

            {testCases.length === 0 && (
              <p className="empty-text">No test cases added yet</p>
            )}

            {testCases.map((tc, index) => (
              <div key={index} className="preview-card">
                <div className="preview-header">
                  <span>
                    Test Case #{index + 1}
                  </span>
                  <span
                    className={
                      tc.isPublic ? "badge public" : "badge private"
                    }
                  >
                    {tc.isPublic ? "Public" : "Private"}
                  </span>
                </div>

                <pre>{tc.input}</pre>
                <pre>{tc.output}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/admin/questions/create")}
          >
            ← Back
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/admin/dashboard")}
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTestCases;
