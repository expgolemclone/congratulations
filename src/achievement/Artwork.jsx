import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Stack, Text } from '@mantine/core';

export function Artwork({ kind, value, reducedMotion, paused, replay, label }) {
  const canvas = useRef(), controller = useRef(), settings = useRef();
  const [state, setState] = useState('loading');
  settings.current = { value, reducedMotion, paused };
  useEffect(() => {
    const node = canvas.current;
    let cancelled = false, failed = false, frame, player, resize, intersection;
    let inView = false, elapsed = 0, previous;
    setState('loading');
    const cancel = () => { cancelAnimationFrame(frame); frame = undefined; previous = undefined; };
    const fail = () => { failed = true; cancel(); node.dataset.motion = 'error'; setState('error'); };
    const draw = () => {
      if (!player || failed || cancelled) return;
      try { player.draw(settings.current.reducedMotion ? 0 : elapsed, settings.current.value); }
      catch { fail(); }
    };
    const reconcile = () => {
      const { reducedMotion, paused } = settings.current;
      if (cancelled || failed) return;
      const running = !reducedMotion && !paused && inView && !document.hidden;
      node.dataset.motion = reducedMotion ? 'static' : paused ? 'paused' : running ? 'running' : 'suspended';
      if (!running) cancel();
      else if (frame === undefined) frame = requestAnimationFrame(tick);
    };
    const tick = now => {
      frame = undefined;
      if (previous !== undefined) elapsed += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      draw(); reconcile();
    };
    const refresh = () => { draw(); reconcile(); };
    const initialize = async () => {
      try {
        const module = await (['chrome', 'knot', 'island', 'galaxy', 'neon'].includes(kind) ?
          import('./artwork/three.mjs') : import('./artwork/canvas.mjs'));
        if (cancelled) return;
        player = await module.createArtwork(node, kind);
        if (cancelled) { player.dispose(); return; }
        draw();
        if (failed) return;
        setState('ready');
        controller.current = { refresh, restart() { elapsed = 0; refresh(); } };
        resize = new ResizeObserver(draw); resize.observe(node);
        intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; reconcile(); });
        intersection.observe(node);
        reconcile();
      } catch { if (!cancelled) fail(); }
    };
    void initialize();
    document.addEventListener('visibilitychange', reconcile);
    node.addEventListener('webglcontextlost', fail);
    return () => {
      cancelled = true; cancel(); resize?.disconnect(); intersection?.disconnect();
      document.removeEventListener('visibilitychange', reconcile);
      node.removeEventListener('webglcontextlost', fail);
      controller.current = null; player?.dispose();
    };
  }, [kind]);
  useEffect(() => { controller.current?.refresh(); }, [value, reducedMotion, paused]);
  useEffect(() => { controller.current?.restart(); }, [replay]);
  return <Stack gap="xs">
    <Box component="canvas" ref={canvas} w="100%" h={{ base: 260, sm: 380 }} display={state === 'error' ? 'none' : 'block'}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} data-artwork={kind} data-art-state={state} />
    {state === 'loading' && <Text role="status" size="sm">祝福の光景を準備しています...</Text>}
    {state === 'error' && <Alert role="alert" color="red" title="祝福の光景を描画できませんでした">ページを再読み込みして, この演出を再試行してください.</Alert>}
  </Stack>;
}
