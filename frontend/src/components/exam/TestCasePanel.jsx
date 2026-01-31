function TestCasePanel({ results }) {
    return (
      <div style={styles.panel}>
        <h4>Test Case Results</h4>
  
        {results.map((tc) => (
          <div
            key={tc.id}
            style={{
              ...styles.row,
              backgroundColor: tc.passed ? "#ecfdf5" : "#fee2e2"
            }}
          >
            <strong>Test {tc.id}</strong> —{" "}
            {tc.passed ? "Passed ✅" : "Failed ❌"}
          </div>
        ))}
      </div>
    );
  }
  
  export default TestCasePanel;
  
  const styles = {
    panel: {
      padding: "12px",
      borderTop: "1px solid #e5e7eb",
      background: "#ffffff"
    },
    row: {
      padding: "6px 10px",
      marginTop: "6px",
      borderRadius: "4px",
      fontSize: "14px"
    }
  };
  