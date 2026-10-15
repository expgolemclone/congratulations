export const CORRECT_FEEDBACK_CSS = `
  .congratulations-feedback {
    --feedback-accent: oklch(0.79 0.14 151);
    --feedback-border: oklch(0.72 0.14 151);
    --feedback-surface: oklch(0.29 0.075 151);
    --feedback-text: oklch(0.97 0.02 151);
    position: relative;
    isolation: isolate;
    display: grid;
    width: min(100%, 34rem);
    min-height: 72px;
    margin: 16px auto;
    place-content: center;
    gap: 8px;
    overflow: hidden;
    box-sizing: border-box;
    border: 2px solid var(--feedback-border);
    border-radius: 18px;
    padding: 14px 20px;
    background: var(--feedback-surface);
    color: var(--feedback-text);
    box-shadow: 0 12px 36px oklch(0.08 0.025 151 / 0.42);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    text-align: center;
    pointer-events: none;
    animation: congratulations-feedback-enter 180ms cubic-bezier(.2, .8, .2, 1) both;
  }

  .congratulations-feedback::before,
  .congratulations-feedback::after {
    position: absolute;
    z-index: 0;
    pointer-events: none;
    content: "";
  }

  .congratulations-feedback-badge,
  .congratulations-feedback-message {
    position: relative;
    z-index: 1;
  }

  .congratulations-feedback-badge {
    justify-self: center;
    border: 1px solid color-mix(in oklch, var(--feedback-accent), white 28%);
    border-radius: 999px;
    padding: 4px 9px;
    background: color-mix(in oklch, var(--feedback-surface), black 18%);
    color: var(--feedback-accent);
    font-size: 11px;
    font-weight: 850;
    line-height: 1;
    letter-spacing: .14em;
  }

  .congratulations-feedback-message {
    font-size: clamp(24px, 7vw, 48px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -.035em;
    overflow-wrap: anywhere;
  }

  .congratulations-feedback[data-rarity="rare"] {
    --feedback-accent: oklch(0.84 0.13 215);
    --feedback-border: oklch(0.72 0.15 215);
    --feedback-surface: oklch(0.27 0.075 222);
    --feedback-text: oklch(0.97 0.025 215);
    width: min(100%, 38rem);
    min-height: 88px;
    box-shadow:
      0 16px 48px oklch(0.12 0.06 220 / 0.56),
      0 0 32px oklch(0.72 0.15 215 / 0.3);
  }

  .congratulations-feedback[data-rarity="rare"]::before {
    inset: -80% -30%;
    background: linear-gradient(
      115deg,
      transparent 38%,
      oklch(0.96 0.04 215 / 0.52) 48%,
      transparent 58%
    );
    animation: congratulations-feedback-sheen 900ms ease-out both;
  }

  .congratulations-feedback[data-rarity="rare"]
    .congratulations-feedback-message {
    font-size: clamp(28px, 7.5vw, 54px);
  }

  .congratulations-feedback[data-rarity="super-rare"] {
    --feedback-accent: oklch(0.82 0.18 315);
    --feedback-border: oklch(0.7 0.21 315);
    --feedback-surface: oklch(0.25 0.09 305);
    --feedback-text: oklch(0.98 0.025 315);
    width: min(100%, 42rem);
    min-height: 108px;
    border-width: 3px;
    box-shadow:
      0 20px 64px oklch(0.1 0.07 300 / 0.62),
      0 0 42px oklch(0.72 0.2 315 / 0.4),
      inset 0 0 28px oklch(0.85 0.12 330 / 0.12);
  }

  .congratulations-feedback[data-rarity="super-rare"]::before {
    inset: 5px;
    border: 1px solid oklch(0.92 0.08 320 / 0.62);
    border-radius: 13px;
    animation: congratulations-feedback-ring 780ms ease-out both;
  }

  .congratulations-feedback[data-rarity="super-rare"]::after {
    inset: -45%;
    background:
      radial-gradient(circle at 20% 30%, white 0 2px, transparent 3px),
      radial-gradient(circle at 76% 24%, white 0 1px, transparent 2px),
      radial-gradient(circle at 68% 76%, white 0 2px, transparent 3px),
      radial-gradient(circle at 30% 82%, white 0 1px, transparent 2px);
    opacity: .7;
    animation: congratulations-feedback-sparkle 900ms ease-out both;
  }

  .congratulations-feedback[data-rarity="super-rare"]
    .congratulations-feedback-message {
    font-size: clamp(34px, 8vw, 64px);
  }

  .congratulations-feedback[data-rarity="ssr"] {
    --feedback-accent: oklch(0.9 0.17 92);
    --feedback-border: oklch(0.88 0.16 88);
    --feedback-surface: oklch(0.2 0.055 75);
    --feedback-text: oklch(0.99 0.025 94);
    position: fixed;
    z-index: 2147483647;
    inset: 0;
    width: auto;
    min-height: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    padding:
      max(28px, env(safe-area-inset-top))
      max(20px, env(safe-area-inset-right))
      max(28px, env(safe-area-inset-bottom))
      max(20px, env(safe-area-inset-left));
    background:
      radial-gradient(circle at 50% 48%, oklch(0.55 0.16 86 / 0.56), transparent 34%),
      radial-gradient(circle at 50% 50%, oklch(0.28 0.08 74), oklch(0.12 0.025 70) 74%);
    box-shadow: inset 0 0 90px oklch(0.9 0.17 92 / 0.24);
  }

  .congratulations-feedback[data-rarity="ssr"]::before {
    inset: -55vmax;
    background: repeating-conic-gradient(
      from 0deg,
      oklch(0.96 0.1 94 / 0.2) 0deg 5deg,
      transparent 5deg 14deg
    );
    animation: congratulations-feedback-rays 6s linear infinite;
  }

  .congratulations-feedback[data-rarity="ssr"]::after {
    inset: 0;
    background:
      radial-gradient(circle at 12% 18%, white 0 2px, transparent 3px),
      radial-gradient(circle at 84% 15%, oklch(0.95 0.12 95) 0 3px, transparent 4px),
      radial-gradient(circle at 75% 72%, white 0 2px, transparent 3px),
      radial-gradient(circle at 18% 78%, oklch(0.95 0.12 95) 0 3px, transparent 4px),
      radial-gradient(circle at 92% 48%, white 0 2px, transparent 3px),
      radial-gradient(circle at 42% 9%, oklch(0.95 0.12 95) 0 2px, transparent 3px);
    filter: drop-shadow(0 0 8px oklch(0.92 0.14 92));
    animation: congratulations-feedback-particles 900ms ease-out both;
  }

  .congratulations-feedback[data-rarity="ssr"]
    .congratulations-feedback-badge {
    padding: 7px 15px;
    font-size: 14px;
    letter-spacing: .22em;
    box-shadow: 0 0 24px oklch(0.9 0.17 92 / 0.56);
  }

  .congratulations-feedback[data-rarity="ssr"]
    .congratulations-feedback-message {
    max-width: 15ch;
    font-size: clamp(42px, 12vw, 92px);
    line-height: .96;
    text-shadow:
      0 0 18px oklch(0.96 0.12 95 / 0.5),
      0 5px 0 oklch(0.38 0.1 76 / 0.72);
  }

  .congratulations-feedback[data-state="leaving"] {
    animation: congratulations-feedback-leave 180ms ease-in both;
  }

  @keyframes congratulations-feedback-enter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(.94);
    }
  }

  @keyframes congratulations-feedback-leave {
    to {
      opacity: 0;
      transform: translateY(-10px) scale(.98);
    }
  }

  @keyframes congratulations-feedback-sheen {
    from { transform: translateX(-58%) rotate(8deg); }
    to { transform: translateX(58%) rotate(8deg); }
  }

  @keyframes congratulations-feedback-ring {
    from { opacity: 0; transform: scale(.82); }
    55% { opacity: 1; }
    to { opacity: .5; transform: scale(1); }
  }

  @keyframes congratulations-feedback-sparkle {
    from { opacity: 0; transform: rotate(-8deg) scale(.72); }
    45% { opacity: 1; }
    to { opacity: .7; transform: rotate(8deg) scale(1); }
  }

  @keyframes congratulations-feedback-rays {
    to { transform: rotate(1turn); }
  }

  @keyframes congratulations-feedback-particles {
    from { opacity: 0; transform: scale(.58); }
    45% { opacity: 1; }
    to { opacity: .85; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .congratulations-feedback,
    .congratulations-feedback[data-state="leaving"],
    .congratulations-feedback::before,
    .congratulations-feedback::after {
      animation: none;
      transition: none;
    }
  }
`;

