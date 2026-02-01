import "../../styles/admin.css";

function Results() {
  // UI-only mock data
  const results = [
    {
      rollNo: "21CS101",
      name: "Rahul",
      score: 85,
      timeTaken: "78 mins",
      status: "Submitted",
    },
    {
      rollNo: "21CS102",
      name: "Anjali",
      score: 72,
      timeTaken: "85 mins",
      status: "Submitted",
    },
    {
      rollNo: "21CS103",
      name: "Kiran",
      score: 0,
      timeTaken: "-",
      status: "Not Submitted",
    },
  ];

  return (
    <div className="admin-page">
      <div className="results-container">
        {/* Header */}
        <div className="question-header">
          <h1>Exam Results</h1>
          <p>Student performance overview (LAN-based exam)</p>
        </div>

        {/* Table */}
        <div className="results-card">
          <table className="results-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Status</th>
                <th>Score</th>
                <th>Time Taken</th>
              </tr>
            </thead>

            <tbody>
              {results.map((r, index) => (
                <tr key={index}>
                  <td>{r.rollNo}</td>
                  <td>{r.name}</td>
                  <td>
                    <span
                      className={
                        r.status === "Submitted"
                          ? "status submitted"
                          : "status not-submitted"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>{r.score}</td>
                  <td>{r.timeTaken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Results;
