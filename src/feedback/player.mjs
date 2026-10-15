import { chooseCorrectFeedbackVariant, CORRECT_FEEDBACK_MINIMUM_DURATION_MS,
  CORRECT_FEEDBACK_LEAVE_DURATION_MS } from './variants.mjs';
import { CORRECT_FEEDBACK_CSS } from './styles.mjs';
import { renderCorrectFeedbackElement } from './view.mjs';
import { createFeedbackSilence, playCorrectFeedbackAudio } from './audio.mjs';

function playbackError(cause) {
  const error = new Error('Feedback audio could not be played.', { cause });
  error.code = cause?.name === 'NotAllowedError' ? 'autoplay_blocked' : 'audio_playback_failed';
  return error;
}

export function createFeedbackPlayer(element) {
  const document = element.ownerDocument;
  if (!document.getElementById('congratulations-feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'congratulations-feedback-styles';
    style.textContent = CORRECT_FEEDBACK_CSS;
    document.head.appendChild(style);
  }
  element.classList.add('congratulations-feedback');
  element.hidden = true;
  const audio = document.createElement('audio');
  audio.preload = 'auto';
  audio.className = 'congratulations-feedback-audio';
  let activation = null, controller = null, audioURL = '', generation = 0;

  function clearAudio() {
    audio.onended = audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL = '';
  }
  function stop() {
    generation++;
    controller?.abort();
    controller = null;
    activation = null;
    clearAudio();
    element.hidden = true;
    element.replaceChildren();
  }
  function prepare() {
    stop();
    const token = generation;
    audioURL = URL.createObjectURL(createFeedbackSilence());
    audio.src = audioURL;
    // Invoke play synchronously within the caller's click/tap/keyboard handler.
    try {
      activation = Promise.resolve(audio.play()).then(() => {
        if (token === generation) audio.pause();
        return { error: null };
      }, error => ({ error: playbackError(error) }));
    } catch (error) { activation = Promise.resolve({ error: playbackError(error) }); }
  }
  function delay(milliseconds, signal) {
    return new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Feedback cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  function playAudio(source, signal) {
    if (signal.aborted) return Promise.reject(new DOMException('Feedback cancelled', 'AbortError'));
    clearAudio();
    if (typeof source === 'string') audio.src = source;
    else { audioURL = URL.createObjectURL(source); audio.src = audioURL; }
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
        clearAudio();
        if (error) reject(error); else resolve(true);
      };
      const abort = () => finish(new DOMException('Feedback cancelled', 'AbortError'));
      const timeout = setTimeout(() => finish(playbackError(Error('Audio playback timed out'))), 15000);
      signal.addEventListener('abort', abort, { once: true });
      audio.onended = () => finish();
      audio.onerror = () => finish(playbackError(Error('Audio decoding failed')));
      try { Promise.resolve(audio.play()).catch(error => finish(playbackError(error))); }
      catch (error) { finish(playbackError(error)); }
    });
  }
  async function play(variant = chooseCorrectFeedbackVariant()) {
    if (controller) throw Error('Feedback is already playing.');
    if (!activation) throw Error('Prepare feedback during the user gesture before playing.');
    renderCorrectFeedbackElement(element, variant);
    const current = new AbortController();
    controller = current;
    element.removeAttribute('aria-hidden');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.dataset.state = 'entering';
    element.hidden = false;
    const minimum = delay(CORRECT_FEEDBACK_MINIMUM_DURATION_MS, current.signal);
    // Attach rejection handlers immediately so stop() never leaks a rejection.
    const minimumResult = minimum.then(() => null, error => error);
    try {
      const ready = await activation;
      if (current.signal.aborted) throw new DOMException('Feedback cancelled', 'AbortError');
      if (ready.error) throw ready.error;
      await playCorrectFeedbackAudio(variant, source => playAudio(source, current.signal));
      const error = await minimumResult;
      if (error) throw error;
      element.dataset.state = 'leaving';
      await delay(CORRECT_FEEDBACK_LEAVE_DURATION_MS, current.signal);
      return variant;
    } finally {
      await minimumResult;
      if (controller === current) {
        current.abort();
        controller = null;
        clearAudio();
        element.hidden = true;
        element.replaceChildren();
      }
    }
  }
  return { prepare, play, stop };
}
