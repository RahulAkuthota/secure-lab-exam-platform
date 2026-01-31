import { useEffect } from "react";

export default function useTabSwitchDetection(onViolation) {
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        onViolation();
      }
    }

    function handleBlur() {
      onViolation();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [onViolation]);
}
