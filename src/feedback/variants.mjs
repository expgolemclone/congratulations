export const CORRECT_FEEDBACK_LEAVE_DURATION_MS = 180;
export const CORRECT_FEEDBACK_MINIMUM_DURATION_MS = 1200;
export const CORRECT_CHIME_SAMPLE_RATE = 22050;
const CORRECT_FEEDBACK_RANDOM_BUCKETS = 1000;
const UINT16_RANGE = 0x10000;

export const CORRECT_FEEDBACK_VARIANTS = Object.freeze([
  Object.freeze({
    id: "normal",
    label: "NORMAL",
    displayText: "That's Right!!",
    speechText: "That's right!",
    chime: Object.freeze({
      duration: 0.72,
      gain: 0.34,
      tones: Object.freeze([
        Object.freeze({ duration: 0.18, frequency: 880, start: 0 }),
        Object.freeze({ duration: 0.5, frequency: 659.25, start: 0.22 }),
      ]),
    }),
  }),
  Object.freeze({
    id: "rare",
    label: "RARE",
    displayText: "Nice! That's Right!!",
    speechText: "Nice! That's right!",
    chime: Object.freeze({
      duration: 0.74,
      gain: 0.3,
      tones: Object.freeze([
        Object.freeze({ duration: 0.24, frequency: 1046.5, start: 0 }),
        Object.freeze({ duration: 0.24, frequency: 1318.51, start: 0.16 }),
        Object.freeze({ duration: 0.42, frequency: 1567.98, start: 0.32 }),
      ]),
    }),
  }),
  Object.freeze({
    id: "super-rare",
    label: "SUPER RARE",
    displayText: "Amazing! That's Right!!",
    speechText: "Amazing! That's right!",
    chime: Object.freeze({
      duration: 0.86,
      gain: 0.27,
      tones: Object.freeze([
        Object.freeze({ duration: 0.3, frequency: 783.99, start: 0 }),
        Object.freeze({ duration: 0.3, frequency: 987.77, start: 0.13 }),
        Object.freeze({ duration: 0.3, frequency: 1174.66, start: 0.26 }),
        Object.freeze({ duration: 0.47, frequency: 1567.98, start: 0.39 }),
      ]),
    }),
  }),
  Object.freeze({
    id: "ssr",
    label: "SSR",
    displayText: "Legendary! That's Right!!",
    speechText: "Legendary! That's right!",
    chime: Object.freeze({
      duration: 1.02,
      gain: 0.23,
      tones: Object.freeze([
        Object.freeze({ duration: 0.25, frequency: 523.25, start: 0 }),
        Object.freeze({ duration: 0.25, frequency: 659.25, start: 0.09 }),
        Object.freeze({ duration: 0.25, frequency: 783.99, start: 0.18 }),
        Object.freeze({ duration: 0.38, frequency: 1046.5, start: 0.32 }),
        Object.freeze({ duration: 0.38, frequency: 1318.51, start: 0.43 }),
        Object.freeze({ duration: 0.48, frequency: 1567.98, start: 0.54 }),
      ]),
    }),
  }),
]);

const CORRECT_FEEDBACK_VARIANT_BY_ID = new Map(
  CORRECT_FEEDBACK_VARIANTS.map((variant) => [variant.id, variant]),
);

export function randomIntegerBelow(limit, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > UINT16_RANGE) {
    throw new RangeError("limit must be between 1 and 65536.");
  }
  if (typeof cryptoSource?.getRandomValues !== "function") {
    throw new TypeError("Crypto random values are unavailable.");
  }

  const acceptedRange = UINT16_RANGE - (UINT16_RANGE % limit);
  const values = new Uint16Array(1);
  do {
    cryptoSource.getRandomValues(values);
  } while (values[0] >= acceptedRange);
  return values[0] % limit;
}

export function chooseCorrectFeedbackVariant(cryptoSource = globalThis.crypto) {
  const bucket = randomIntegerBelow(CORRECT_FEEDBACK_RANDOM_BUCKETS, cryptoSource);
  if (bucket === 0) {
    return CORRECT_FEEDBACK_VARIANT_BY_ID.get("ssr");
  }
  if (bucket <= 10) {
    return CORRECT_FEEDBACK_VARIANT_BY_ID.get("super-rare");
  }
  if (bucket <= 110) {
    return CORRECT_FEEDBACK_VARIANT_BY_ID.get("rare");
  }
  return CORRECT_FEEDBACK_VARIANT_BY_ID.get("normal");
}

