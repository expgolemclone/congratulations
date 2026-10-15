import { parseCelebration, READY_MESSAGE } from "../contracts/celebration.mjs";

const EXPERIENCE_ID_PATTERN = /^[a-z0-9-]+$/;

function celebrationSearch() {
  const sourceWindow = window.parent === window ? window : window.parent;
  if (sourceWindow.location.origin !== window.location.origin) {
    throw new TypeError("Celebration parent origin is invalid.");
  }
  return sourceWindow.location.search;
}

export function announceCelebration(siteId) {
  if (!EXPERIENCE_ID_PATTERN.test(siteId)) {
    throw new TypeError("Celebration experience ID is invalid.");
  }

  const celebration = parseCelebration(celebrationSearch());
  const announce = () => {
    window.parent.postMessage({ type: READY_MESSAGE, experienceId: siteId, celebration }, window.location.origin);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", announce, { once: true });
    return;
  }
  announce();
}
