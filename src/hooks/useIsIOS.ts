import { useEffect, useState } from "react";

/**
 * Checks if the current browser environment is running on an iOS device (iPhone, iPad, iPod).
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * React hook that returns true if running on iOS (iPhone/iPad), false for Android and desktop.
 */
export function useIsIOS(): boolean {
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    setIsIosDevice(isIOS());
  }, []);

  return isIosDevice;
}
