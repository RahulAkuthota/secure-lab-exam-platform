function LanguageSelector({ languages, value, onChange }) {
    return (
      <div style={styles.wrapper}>
        <label style={styles.label}>Language</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.select}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  export default LanguageSelector;
  
  const styles = {
    wrapper: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    label: {
      fontSize: "14px",
      fontWeight: "600"
    },
    select: {
      padding: "6px 8px",
      borderRadius: "4px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      cursor: "pointer"
    }
  };
  