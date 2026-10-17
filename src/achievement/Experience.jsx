import React, { useState } from 'react';
import { Accordion, Alert, Badge, Blockquote, Box, Button, Card, Center, Divider, Grid, Group,
  Paper, SegmentedControl, SimpleGrid, Slider, Stack, Stepper, Switch, Tabs, Text, Timeline, Title } from '@mantine/core';
import { achievementLabel, celebrationCopy } from './experiences.mjs';
import { Artwork } from './Artwork.jsx';

export function Experience({ experience, celebration, reducedMotion, paused, replay, onCelebrate }) {
  const [value, setValue] = useState(35), [choice, setChoice] = useState('0'), [marked, setMarked] = useState(false);
  const goal = achievementLabel(celebration.achievement), copy = celebrationCopy(celebration);
  const intro = <Stack gap="md" w="100%" miw={0}>
    <Badge size="lg" variant="light">達成</Badge>
    <Title order={1} size="clamp(2rem, 4vw, 3.5rem)" lh={1.25} textWrap="balance">{copy.title}</Title>
    <Title order={2} size="h3" title={goal} lineClamp={3}>{goal}</Title>
    <Text size="xl">{copy.message}</Text>
  </Stack>;
  const art = (kind, control = value, label) => <Artwork kind={kind} value={control} label={label}
    reducedMotion={reducedMotion} paused={paused} replay={replay} />;
  const angle = label => <Slider thumbLabel={label} label={null} value={value} onChange={setValue} min={0} max={100} />;
  const note = (title, text) => <Paper withBorder p="lg" radius="md"><Stack gap="xs"><Title order={3} size="h4">{title}</Title><Text>{text}</Text></Stack></Paper>;
  const received = <Text role="status" size="lg">{copy.message}</Text>;

  switch (experience.id) {
    case 'aperture-lab': return <Grid align="center" gutter="xl">
      <Grid.Col span={{ base: 12, sm: 6 }}>{intro}<Divider my="xl" />
        <Button onClick={() => setMarked(true)} disabled={marked}>日付を入れる</Button></Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}><Paper shadow="md" withBorder p="lg" radius="md"><Stack>
        {art('photo', value, '旧Aperture Labの窓辺の写真. 達成を祝うイメージ写真.')}
        <Text size="xs" c="dimmed">イメージ写真</Text>
        <Text fw={700} lineClamp={3} title={goal}>{goal}</Text>
        {marked && <Text role="status"><time dateTime={celebration.date}>{celebration.date}</time> 達成</Text>}
      </Stack></Paper></Grid.Col>
    </Grid>;
    case 'conche': return <Stack gap="xl">{intro}<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
      {art('chocolate', value, '旧ConcheのFINISHと刻まれたチョコレート.')}
      <Stack><Title order={3}>いったん, ひと休み.</Title>
        <Accordion variant="separated" defaultValue="begin">
          {[['begin', '取り組んだこと', '目標に向けて取り組んだ分, まずは一区切りです.'],
            ['care', 'うまくいかなかったところ', '全部うまくいかなくても, 目標をやり終えたことは別です.'],
            ['finish', 'このあとは', 'すぐに続きを始めなくても大丈夫です. 少し休憩しましょう.']].map(([id, title, text]) =>
            <Accordion.Item key={id} value={id}><Accordion.Control>{title}</Accordion.Control><Accordion.Panel>{text}</Accordion.Panel></Accordion.Item>)}
        </Accordion></Stack></SimpleGrid></Stack>;
    case 'driftline-ocean': return <Stack gap="xl"><Center py="xl"><Box w="100%" maw={740} ta="center">{intro}</Box></Center>
      {art('waves')}<Paper withBorder p="xl" radius="lg"><Stack>
        <Title order={3}>しばらく, のんびり.</Title><Text>波を眺めても, 画面から目を離しても. 休み方は自由です.</Text>
        {angle('波の大きさ')}<Text role="status">{value < 45 ? '小さな波' : '大きな波'}</Text>
      </Stack></Paper></Stack>;
    case 'fathom': return <Grid gutter="xl"><Grid.Col span={{ base: 12, sm: 7 }}>{intro}{art('depth')}</Grid.Col>
      <Grid.Col span={{ base: 12, sm: 5 }}><Stack gap="xl"><Title order={3}>一区切りついたら.</Title>
        <Timeline bulletSize={20} lineWidth={2}>
          <Timeline.Item title="手を止める"><Text>いまの作業から, 少し離れてみましょう.</Text></Timeline.Item>
          <Timeline.Item title="休憩する"><Text>水を飲んだり, 目を休めたり.</Text></Timeline.Item>
          <Timeline.Item title="続きは自分のペースで"><Text>再開するタイミングは, 自分で決めて大丈夫です.</Text></Timeline.Item>
        </Timeline><Button variant="light" onClick={() => setMarked(true)}>休憩する</Button>{marked && received}
      </Stack></Grid.Col></Grid>;
    case 'formwork-chroma': return <Stack gap="xl"><Box ta="center">{intro}</Box>{art('chrome')}
      <Paper withBorder p="xl" radius="lg"><Stack><Title order={3}>好きな角度で眺める.</Title>
        <Text>スライダーで向きを変えられます.</Text>{angle('輝きを見る角度')}
      </Stack></Paper></Stack>;
    case 'formwork-contour': return <Stack gap="xl"><Grid align="center" gutter="xl">
      <Grid.Col span={{ base: 12, sm: 6 }}>{intro}</Grid.Col><Grid.Col span={{ base: 12, sm: 6 }}>{art('contour', marked ? value + 100 : value)}</Grid.Col></Grid>
      <Stepper active={marked ? 2 : 1} orientation="vertical" size="sm">
        <Stepper.Step label="取り組む" description="目標に向けて取り組みました." />
        <Stepper.Step label="達成" description="ここまで完了です. おつかれさまでした." />
        <Stepper.Step label="ひと休み" description="続きは, 自分のペースで." />
      </Stepper><Button size="lg" onClick={() => setMarked(true)} disabled={marked}>旗を立てる</Button>
      {marked && <Alert role="status" title="達成" color="orange"><Text lineClamp={3} title={goal}>{goal}</Text>{copy.message}</Alert>}
    </Stack>;
    case 'formwork-heliodon': return <Grid gutter="xl" align="center"><Grid.Col span={{ base: 12, sm: 7 }}>{art('knot')}
      <Stack>{angle('トロフィーを見る角度')}<Text ta="center" c="dimmed">達成の記念</Text></Stack></Grid.Col>
      <Grid.Col span={{ base: 12, sm: 5 }}><Stack gap="xl">{intro}<Button onClick={() => setMarked(true)}>ひとこと読む</Button>
        {marked && <Blockquote>すぐに次のことを始めなくても大丈夫です. まずは, おつかれさまでした.</Blockquote>}</Stack></Grid.Col></Grid>;
    case 'formwork-isometria': return <Stack gap="xl">{intro}{art('island', value * 0.9 + (marked ? 100 : 0))}
      <Group justify="space-between"><Text fw={700}>少し, 景色を眺めながら.</Text><Switch label="夜の灯台" checked={marked} onChange={event => setMarked(event.currentTarget.checked)} /></Group>
      {angle('島を見る角度')}<SimpleGrid cols={{ base: 1, sm: 3 }}>
        {note('ここまで完了', '目標をやり終えました.')}{note('いったん休憩', '少し手を止めても大丈夫です.')}{note('自分のペースで', '続けるかどうかは, 休んでから考えても.')}
      </SimpleGrid></Stack>;
    case 'formwork-meridian': return <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl"><Stack gap="xl">{intro}
      <Text size="lg">ひと息ついてから, 次のことを考えましょう.</Text>
      <Button size="lg" onClick={() => { setValue(100); setMarked(true); }}>休憩する</Button>
      {marked && received}</Stack>
      <Paper withBorder p="xl" radius="lg"><Stack>{art('gauge')}<Text ta="center" size="sm" c="dimmed">休憩のイメージです. 計測値ではありません.</Text>
        <Title order={3}>ひと息つく時間.</Title>{angle('肩の力をゆるめる')}</Stack></Paper></SimpleGrid>;
    case 'formwork-nebula': return <Stack gap="xl"><Box ta="center">{intro}</Box>{art('galaxy')}
      <Tabs value={choice} onChange={setChoice} variant="pills"><Tabs.List grow>
        <Tabs.Tab value="0">ひと区切り</Tabs.Tab><Tabs.Tab value="1">休憩</Tabs.Tab><Tabs.Tab value="2">再開するときは</Tabs.Tab>
      </Tabs.List><Tabs.Panel value="0" pt="lg"><Text size="lg">目標をやり終えました. おつかれさまでした.</Text></Tabs.Panel>
        <Tabs.Panel value="1" pt="lg"><Text size="lg">少し画面から目を離して, 休憩しませんか.</Text></Tabs.Panel>
        <Tabs.Panel value="2" pt="lg"><Text size="lg">次に取り組むことを, 一つずつ決めていきましょう.</Text></Tabs.Panel>
      </Tabs>{angle('銀河を見る角度')}</Stack>;
    case 'formwork-neon': return <Stack gap="xl"><Paper p="xl" radius="lg" withBorder><Stack align="center" ta="center" gap="xl">
      {intro}<Text size="clamp(2rem, 8vw, 5rem)" fw={900} c="pink">{marked ? 'おつかれさま!' : '達成!'}</Text>
      <Button size="xl" radius="xl" onClick={() => { setMarked(true); onCelebrate(); }}>お祝いする</Button>
      {marked && <Text role="status">{copy.message}</Text>}</Stack></Paper>{art('neon')}
      <Group justify="center"><Badge size="lg" color="cyan">目標達成</Badge><Badge size="lg" color="pink">おつかれさま</Badge></Group>
    </Stack>;
    case 'glyphica': return <Stack gap="xl">{intro}<Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md">
      <Stack>{art('lettering', Number(choice) * 1000 + value)}<Text size="lg" ta="center">{['おつかれさま.', 'できた.', 'ひと休み.'][Number(choice)]}</Text></Stack></Paper>
      <SegmentedControl fullWidth value={choice} onChange={setChoice} data={[{ value: '0', label: 'おつかれさま' }, { value: '1', label: 'できた' }, { value: '2', label: 'ひと休み' }]} />
      <Text size="sm" fw={700}>文字の強さ</Text>{angle('文字の強さ')}</Stack>;
    case 'halcyon-ring': return <Center><Stack gap="xl" maw={720} w="100%" ta="center">{intro}{art('halo')}
      <Title order={3}>何もせず, ひと息.</Title><Text size="lg">少し手を止めて, 休憩しましょう.</Text>
      <Button variant="light" size="lg" onClick={() => setMarked(true)}>休憩する</Button>{marked && received}
    </Stack></Center>;
    case 'halfstep': return <Stack gap="xl"><Grid gutter="xl" align="center"><Grid.Col span={{ base: 12, sm: 5 }}>{intro}</Grid.Col>
      <Grid.Col span={{ base: 12, sm: 7 }}>{art('bicycle', Number(choice) * 20, '旧Halfstepの自転車. 達成を祝うイラスト.')}</Grid.Col></Grid>
      <Paper withBorder p="xl" radius="md"><Stack><Title order={3}>休憩は, 好きな方法で.</Title>
        <SegmentedControl fullWidth value={choice} onChange={setChoice} data={[{ value: '0', label: 'のんびり' }, { value: '1', label: '水を飲む' }, { value: '2', label: '少し歩く' }]} />
        <Text role="status" size="lg">{['何もせず, 少し休みましょう.', '水分をとって, ひと息つきましょう.', '座っていたなら, 少し立ち上がっても.'][Number(choice)]}</Text>
        <Button variant="light" onClick={() => setMarked(true)}>休憩する</Button>{marked && received}</Stack></Paper></Stack>;
    case 'northbound-ev': return <Stack gap="xl">{art('terrain', value, '旧Northboundの等高線と光の道.')}
      {intro}<Divider /><Accordion variant="contained" defaultValue="0">
        {[['ひと区切り', '目標をやり終えました. おつかれさまでした.'], ['目を休める', '少し画面から目を離してみましょう.'], ['再開するときは', '休んでから, 次に取り組むことを考えても大丈夫です.']].map(([title, text], index) =>
          <Accordion.Item key={title} value={String(index)}><Accordion.Control>{title}</Accordion.Control><Accordion.Panel>{text}</Accordion.Panel></Accordion.Item>)}
      </Accordion></Stack>;
    case 'perigee-astro': return <Grid gutter="xl"><Grid.Col span={{ base: 12, sm: 7 }}>{art('stars')}
      <Stack>{angle('望遠鏡の向き')}<Text size="sm" c="dimmed">演出用の星空です. 実際の観測データではありません.</Text></Stack></Grid.Col>
      <Grid.Col span={{ base: 12, sm: 5 }}><Stack gap="xl">{intro}<Card withBorder radius="md" p="xl">
        <Stack><Title order={3}>ひと休み.</Title><Text>しばらく眺めても, 画面を閉じても. 自分のペースでどうぞ.</Text>
          <Button onClick={() => setMarked(true)}>ひとこと読む</Button>
          {marked && <Alert role="status" title="達成" color="indigo"><Text lineClamp={3} title={goal}>{goal}</Text>{copy.message}</Alert>}
        </Stack></Card></Stack></Grid.Col></Grid>;
    default: throw Error(`Unknown celebration: ${experience.id}`);
  }
}
