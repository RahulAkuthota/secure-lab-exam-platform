import { useEffect } from "react";

export default function useFullscreen(enabled, onExit) {
  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = async () => {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    };

    enterFullscreen();

    function handleExit() {
      if (!document.fullscreenElement) {
        onExit?.();
      }
    }

    document.addEventListener("fullscreenchange", handleExit);

    return () => {
      document.removeEventListener("fullscreenchange", handleExit);
    };
  }, [enabled, onExit]);
}
