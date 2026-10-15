import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Badge, Button, Center, MantineProvider, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import confetti from 'canvas-confetti';
import '@mantine/core/styles.css';

import { parseCelebration, READY_MESSAGE } from '../contracts/celebration.mjs';

function Celebration({ celebration }) {
  const [replay, setReplay] = useState(0);
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });

  useEffect(() => {
    document.documentElement.dataset.state = 'ready';
    window.parent.postMessage({ type: READY_MESSAGE, experienceId: 'achievement', celebration }, window.location.origin);
  }, [celebration]);

  useEffect(() => {
    if (reducedMotion || document.hidden) return;

    const options = {
      disableForReducedMotion: true,
      colors: ['#ffd43b', '#ff8787', '#b197fc', '#66d9e8', '#ffffff'],
      ticks: 180,
      spread: 75,
      startVelocity: 45,
    };
    const burst = () => {
      confetti({ ...options, particleCount: 65, angle: 60, origin: { x: 0, y: 0.7 } });
      confetti({ ...options, particleCount: 65, angle: 120, origin: { x: 1, y: 0.7 } });
    };
    burst();
    const timers = [window.setTimeout(burst, 400), window.setTimeout(burst, 800)];
    const stop = () => {
      timers.forEach(window.clearTimeout);
      confetti.reset();
    };
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [replay, reducedMotion]);

  const achievement = celebration.achievement.replace(/[.-]+/g, ' ');
  const achievementLabel = achievement[0].toUpperCase() + achievement.slice(1);
  const dateLabel = new Intl.DateTimeFormat('en', {
    dateStyle: 'long', timeZone: 'UTC',
  }).format(new Date(`${celebration.date}T00:00:00Z`));

  return (
    <Stack align="center" gap="lg" w="100%" maw={640} ta="center">
      <Badge color="yellow" variant="light" size="lg">Goal complete</Badge>
      <ThemeIcon size={112} radius="xl" variant="gradient" gradient={{ from: 'grape', to: 'pink' }} aria-hidden="true">
        <Text component="span" fz={64}>🏆</Text>
      </ThemeIcon>
      <Title order={1} size="clamp(3rem, 12vw, 6rem)" lh={1.1}>You did it!</Title>
      <Title order={2} size="h2" c="yellow.3" maw="100%" lineClamp={3} title={achievementLabel}>{achievementLabel}</Title>
      <Text size="xl">You followed through. That deserves a celebration.</Text>
      <Text size="lg" c="dimmed">Take a breath. Enjoy this win. You earned it.</Text>
      <Stack gap={4} align="center" maw="100%">
        <Text size="sm" c="dimmed"><time dateTime={celebration.date}>{dateLabel}</time></Text>
        <Text size="xs" c="dimmed" maw="100%" truncate="end" title={celebration.source}>{celebration.source}</Text>
      </Stack>
      {!reducedMotion && (
        <Button size="lg" radius="xl" variant="gradient" gradient={{ from: 'grape', to: 'pink' }} onClick={() => setReplay(value => value + 1)}>
          Celebrate again
        </Button>
      )}
    </Stack>
  );
}

let celebration;
let error;
try {
  celebration = parseCelebration(window.location.search);
} catch (cause) {
  error = cause;
  document.documentElement.dataset.state = 'error';
  document.title = 'Celebration unavailable';
}

createRoot(document.getElementById('root')).render(
  <MantineProvider forceColorScheme="dark">
    <Center component="main" mih="100svh" px="lg" py="xl">
      {error ? (
        <Alert color="red" title="The celebration could not be opened" role="alert">
          {error.message}
        </Alert>
      ) : <Celebration celebration={celebration} />}
    </Center>
  </MantineProvider>,
);
