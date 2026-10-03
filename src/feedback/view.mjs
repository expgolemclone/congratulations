import { CORRECT_FEEDBACK_VARIANTS } from "./variants.mjs";

export function renderCorrectFeedbackElement(element, variant) {
  if (
    !(element instanceof element.ownerDocument.defaultView.HTMLElement) ||
    !CORRECT_FEEDBACK_VARIANTS.includes(variant)
  ) {
    throw new TypeError("Correct feedback rendering input is invalid.");
  }

  const ownerDocument = element.ownerDocument;
  const badge = ownerDocument.createElement("span");
  badge.className = "congratulations-feedback-badge";
  badge.textContent = variant.label;
  const message = ownerDocument.createElement("span");
  message.className = "congratulations-feedback-message";
  message.textContent = variant.displayText;
  element.dataset.rarity = variant.id;
  element.setAttribute("aria-hidden", "true");
  element.replaceChildren(badge, message);
}
