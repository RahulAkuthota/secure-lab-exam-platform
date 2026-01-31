import { useEffect, useState } from "react";

export default function useTimer(initialSeconds) {
  const [time, setTime] = useState(null);

  useEffect(() => {
    if (initialSeconds === null) return;

    setTime(initialSeconds);

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds]);

  return time;
}
