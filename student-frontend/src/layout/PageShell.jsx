function PageShell({ title, subtitle, rightAction, children }) {
  return (
    <div className="page">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <main className="shell">
        <header className="shell-header">
          <div>
            <p className="eyebrow">Secure Lab Exam</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          {rightAction ? <div>{rightAction}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

export default PageShell;
