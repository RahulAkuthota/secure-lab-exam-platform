import { useEffect } from "react";

export default function useFullscreen(enabled, onExit) {
  useEffect(() => {
    if (!enabled) return;

    let destroyed = false;

    const enterFullscreen = async () => {
      if (destroyed || document.fullscreenElement) return true;
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch (error) {
        return false;
      }
    };

    const enforceFullscreen = async () => {
      await enterFullscreen();
    };

    enforceFullscreen();

    const handleExit = () => {
      if (!document.fullscreenElement) {
        onExit?.();
        enforceFullscreen();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !document.fullscreenElement) {
        enforceFullscreen();
      }
    };

    const handleWindowFocus = () => {
      if (!document.fullscreenElement) {
        enforceFullscreen();
      }
    };

    const handleUserGesture = () => {
      if (!document.fullscreenElement) {
        enforceFullscreen();
      }
    };

    const retryId = window.setInterval(() => {
      if (!document.hidden && !document.fullscreenElement) {
        enforceFullscreen();
      }
    }, 1000);

    document.addEventListener("fullscreenchange", handleExit);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("click", handleUserGesture, true);
    document.addEventListener("keydown", handleUserGesture, true);
    document.addEventListener("touchstart", handleUserGesture, true);

    return () => {
      destroyed = true;
      window.clearInterval(retryId);
      document.removeEventListener("fullscreenchange", handleExit);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("click", handleUserGesture, true);
      document.removeEventListener("keydown", handleUserGesture, true);
      document.removeEventListener("touchstart", handleUserGesture, true);
    };
  }, [enabled, onExit]);
}
