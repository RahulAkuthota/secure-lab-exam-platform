function PageShell({ title, subtitle, rightAction, children }) {
  return (
    <div className="page">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <main className="shell">
        <header className="shell-header">
          <div className="shell-header-copy">
            <p className="eyebrow">Secure Lab Exam</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          {rightAction ? <div className="shell-header-meta">{rightAction}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

export default PageShell;
