import type { BrowserInfo } from "@/types/feedback";

export const getBrowserInfo = (): BrowserInfo => {
  if (typeof window === "undefined") {
    return {
      userAgent: "Unknown",
      platform: "Unknown",
      language: "Unknown",
    };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    url: window.location.href,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};
