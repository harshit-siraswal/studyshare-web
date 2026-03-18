declare global {
  interface Window {
    va?: {
      track?: (eventName: string, payload?: Record<string, unknown>) => void;
    };
  }
}

export function trackLandingEvent(eventName: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const tracking = window.va?.track;
  if (typeof tracking === "function") {
    tracking(eventName, payload);
  }
}

export {};
