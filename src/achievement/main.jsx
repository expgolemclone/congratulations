import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Badge, Box, Button, Center, Container, Divider, Grid, Group, MantineProvider, Paper, Slider, Stack, Text, Title } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import confetti from 'canvas-confetti';
import '@mantine/core/styles.css';
import { celebrationSearch, parseCelebration, READY_MESSAGE } from '../contracts/celebration.mjs';
import { achievementLabel, celebrationCopy, chooseExperience, experienceForPath } from './experiences.mjs';
import { Experience } from './Experience.jsx';
import { Artwork } from './Artwork.jsx';

function Celebration({ celebration, experience }) {
  const [replay, setReplay] = useState(0), [paused, setPaused] = useState(false), [framing, setFraming] = useState(125);
  const copy = celebrationCopy(celebration), goal = achievementLabel(celebration.achievement);
  const centered = experience.layout === 'center', reverse = experience.layout === 'reverse';
  const date = new Intl.DateTimeFormat('ja', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${celebration.date}T00:00:00Z`));
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
    <Stack gap={{ base: 64, sm: 100 }}>
      <Group justify="space-between" gap="sm">
        <Group gap="sm"><Text size="sm" fw={700}>{experience.label}</Text>
          {!reducedMotion && <Button size="compact-xs" variant="subtle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
            {paused ? '動きを再開' : '動きを一時停止'}
          </Button>}
        </Group>
        <Text size="sm" c="dimmed"><time dateTime={celebration.date}>{date}</time></Text>
      </Group>
      <Box component="section" data-chapter="hero" aria-label="達成のお祝い">
        <Experience experience={experience} celebration={celebration} reducedMotion={reducedMotion} paused={paused} replay={replay} onCelebrate={() => setReplay(value => value + 1)} />
      </Box>
      {experience.chapters.map((chapter, index) => <Box component="section" key={chapter} data-chapter={chapter}
        aria-labelledby={`chapter-${chapter}`}>
        <Group gap="md" mb="xl"><Text size="xs" fw={700}>{String(index + 2).padStart(2, '0')}</Text><Divider flex={1} /></Group>
        {chapter === 'record' && <Paper withBorder radius={experience.layout === 'receipt' ? 0 : 'lg'} p={{ base: 'xl', sm: 56 }}>
          <Stack gap="xl" ta={centered || experience.layout === 'receipt' ? 'center' : undefined}>
            <Title id="chapter-record" order={2} size="h3">ここまで完了.</Title>
            <Text size="clamp(3.5rem, 12vw, 8rem)" fw={900} lh={1} c={experience.color}>DONE.</Text>
            <Text size="clamp(1.4rem, 3vw, 2.5rem)" fw={700} lineClamp={3}>{goal}</Text>
            <Divider />
            <Group justify={centered || experience.layout === 'receipt' ? 'center' : 'space-between'} gap="lg">
              <Text size="lg"><time dateTime={celebration.date}>{date}</time></Text>
              <Badge size="xl" variant="light">達成</Badge>
            </Group>
            <Text c="dimmed">{copy.message}</Text>
          </Stack>
        </Paper>}
        {chapter === 'exhibit' && <Stack gap="xl">
          <Grid gutter="xl" align="end">
            <Grid.Col span={{ base: 12, sm: centered ? 12 : 7 }} order={reverse ? 2 : 1}>
              <Stack gap="md" ta={centered ? 'center' : undefined}>
                <Text size="sm" c="dimmed">{experience.label}</Text>
                <Title id="chapter-exhibit" order={2} size="clamp(2rem, 5vw, 4rem)" lh={1.2}>{experience.exhibit}</Title>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: centered ? 12 : 5 }} order={reverse ? 1 : 2}>
              <Text size="lg" ta={centered ? 'center' : undefined}>少し近づいて, 眺めてみる.</Text>
            </Grid.Col>
          </Grid>
          <Paper withBorder radius="lg" p={{ base: 'xs', sm: 'lg' }}>
            <Artwork kind={experience.artwork} value={65} framing={framing / 100} height={{ base: 440, sm: 580 }}
              reducedMotion={reducedMotion} paused={paused} replay={replay} label={`${experience.exhibit}. 拡大して見る祝福のビジュアル.`} />
          </Paper>
          <Stack gap="sm" maw={480} w="100%" mx={centered ? 'auto' : undefined}>
            <Group justify="space-between"><Text fw={700}>見る距離</Text><Text size="sm" c="dimmed">{(framing / 100).toFixed(2)}×</Text></Group>
            <Slider min={100} max={175} value={framing} onChange={setFraming} thumbLabel="ビジュアルの拡大率" label={value => `${(value / 100).toFixed(2)}×`} />
            <Text size="sm" c="dimmed">スライダーで拡大できます. 学習の成績や計測値ではありません.</Text>
          </Stack>
        </Stack>}
        {chapter === 'note' && <Grid gutter={{ base: 'xl', sm: 64 }} align="center">
          <Grid.Col span={{ base: 12, sm: centered ? 12 : 7 }} order={reverse ? 2 : 1}>
            <Stack gap="xl" ta={centered ? 'center' : undefined}>
              <Text size="sm" c="dimmed">一区切りついたら</Text>
              <Title id="chapter-note" order={2} size="clamp(2.5rem, 6vw, 5rem)" lh={1.2} textWrap="balance">今は,<br />ひと休み.</Title>
              <Text size="xl">やることを終えたので,<br />すぐに次を始めなくても大丈夫です.</Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: centered ? 12 : 5 }} order={reverse ? 1 : 2}>
            <Stack gap="xl" maw={centered ? 580 : undefined} mx="auto">
              <Divider />
              <Text size="lg" fw={700}>画面から目を離す.</Text>
              <Text c="dimmed">少し遠くを見たり, 軽く体を動かしたり. 座りっぱなしだったら, 一度立ち上がっても.</Text>
              <Divider />
              <Text size="lg" fw={700}>水を飲む. 何もしない.</Text>
              <Text c="dimmed">休憩中まで頑張らなくて大丈夫です. 好きな過ごし方でどうぞ.</Text>
            </Stack>
          </Grid.Col>
        </Grid>}
        {chapter === 'panorama' && <Stack gap="xl" ta="center">
          <Text size="sm" c="dimmed">{experience.label}</Text>
          <Title id="chapter-panorama" order={2} size="clamp(2rem, 5vw, 3.5rem)">もう少し, 眺めてから.</Title>
          <Artwork kind={experience.artwork} value={15} framing={0.8} height={{ base: 400, sm: 520 }}
            reducedMotion={reducedMotion} paused={paused} replay={replay} label={`${experience.exhibit}. 少し離れて見る祝福のビジュアル.`} />
          <Text size="lg">このまま眺めても, ここで閉じても.<br />おつかれさまでした.</Text>
        </Stack>}
      </Box>)}
      <Paper component="footer" data-chapter="closing" withBorder radius="lg" p={{ base: 'xl', sm: 48 }}>
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
