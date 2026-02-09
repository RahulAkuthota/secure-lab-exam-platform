function ToastHost({ toasts, onRemove }) {
  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)}>x</button>
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
