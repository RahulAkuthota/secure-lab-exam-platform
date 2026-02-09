function PageShell({ title, subtitle, rightAction, children }) {
  return (
    <div className="page">
      <div className="bg-orb bg-orb-one" />
      <div className="bg-orb bg-orb-two" />
      <main className="shell">
        <header className="shell-header">
          <div>
            <p className="eyebrow">Secure Lab Exam Platform</p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          {rightAction}
        </header>
        {children}
      </main>
    </div>
  );
}

export default PageShell;
