import { useCallback, useState } from "react";
import AppRoutes from "./app/AppRoutes";
import ToastHost from "./components/ToastHost";

function App() {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  }, []);

  return (
    <>
      <AppRoutes pushToast={pushToast} />
      <ToastHost
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))}
      />
    </>
  );
}

export default App;
