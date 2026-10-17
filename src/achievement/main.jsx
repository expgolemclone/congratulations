import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Box, Button, Center, Container, Group, MantineProvider, Paper, Stack, Text, Title } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import confetti from 'canvas-confetti';
import '@mantine/core/styles.css';
import { celebrationSearch, parseCelebration, READY_MESSAGE } from '../contracts/celebration.mjs';
import { celebrationCopy, chooseExperience, experienceForPath } from './experiences.mjs';
import { Experience } from './Experience.jsx';

function Celebration({ celebration, experience }) {
  const [replay, setReplay] = useState(0), [paused, setPaused] = useState(false);
  const copy = celebrationCopy(celebration);
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  useEffect(() => {
    document.documentElement.dataset.state = 'ready';
    document.documentElement.dataset.experienceId = experience.id;
    document.title = `${experience.label} | 達成おめでとう`;
    window.parent.postMessage({ type: READY_MESSAGE, experienceId: experience.id, celebration }, window.location.origin);
  }, [celebration, experience]);

  useEffect(() => {
    if (reducedMotion || paused || document.hidden || !['formwork-neon', 'formwork-chroma', 'halfstep', 'aperture-lab', 'conche', 'glyphica', 'formwork-contour'].includes(experience.id)) return;
    const burst = () => {
      const options = { disableForReducedMotion: true, ticks: 130, spread: 75, startVelocity: 38 };
      confetti({ ...options, particleCount: 45, angle: 60, origin: { x: 0, y: 0.7 } });
      confetti({ ...options, particleCount: 45, angle: 120, origin: { x: 1, y: 0.7 } });
    };
    burst();
    const timers = [setTimeout(burst, 300), setTimeout(burst, 600)];
    const stop = () => { timers.forEach(clearTimeout); confetti.reset(); };
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [experience, replay, reducedMotion, paused]);

  return <Container component="main" size="lg" py={{ base: 'lg', sm: 60 }}>
    <Stack gap={48}>
      <Group justify="space-between" gap="sm">
        <Group gap="sm"><Text size="sm" fw={700}>{experience.label}</Text>
          {!reducedMotion && <Button size="compact-xs" variant="subtle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
            {paused ? '動きを再開' : '動きを一時停止'}
          </Button>}
        </Group>
        <Text size="sm" c="dimmed"><time dateTime={celebration.date}>{new Intl.DateTimeFormat('ja', {
          dateStyle: 'long', timeZone: 'UTC',
        }).format(new Date(`${celebration.date}T00:00:00Z`))}</time></Text>
      </Group>
      <Experience experience={experience} celebration={celebration} reducedMotion={reducedMotion} paused={paused} replay={replay} onCelebrate={() => setReplay(value => value + 1)} />
      <Paper component="footer" withBorder radius="lg" p={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg" align="center" ta="center">
          <Title order={3} size="h3">{copy.closing}</Title>
          <Group justify="center">
            {!reducedMotion && <Button variant="light" disabled={paused} onClick={() => setReplay(value => value + 1)}>祝福をもう一度</Button>}
            <Button variant="subtle" onClick={() => location.assign(`/experiences/${chooseExperience(experience.id).id}/?${celebrationSearch(celebration)}`)}>別の祝福を見る</Button>
          </Group>
          <Text size="xs" c="dimmed" maw="100%" truncate="end" title={celebration.source}>{celebration.source}</Text>
        </Stack>
      </Paper>
    </Stack>
  </Container>;
}

let celebration, experience, error;
try {
  celebration = parseCelebration(window.location.search);
  experience = experienceForPath(window.location.pathname) || chooseExperience();
} catch (cause) {
  error = cause;
  document.documentElement.dataset.state = 'error';
  document.title = '祝福ページを開けませんでした';
}

createRoot(document.getElementById('root')).render(
  <MantineProvider forceColorScheme={experience?.scheme || 'dark'} theme={{ primaryColor: experience?.color || 'violet', fontFamily: 'system-ui, "Yu Gothic", Meiryo, sans-serif' }}>
    <Box mih="100svh" bg={experience?.background}>
      {error ? <Center component="main" mih="100svh" p="lg"><Alert color="red" title="祝福ページを開けませんでした" role="alert">{error.message}</Alert></Center> :
        <Celebration celebration={celebration} experience={experience} />}
    </Box>
  </MantineProvider>,
);
