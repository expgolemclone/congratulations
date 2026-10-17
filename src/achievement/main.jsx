import React from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Center, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { celebrationSearch, parseCelebration } from '../contracts/celebration.mjs';
import { chooseExperience } from './experiences.mjs';

try {
  const celebration = parseCelebration(location.search);
  location.replace(`/experiences/${chooseExperience().id}/?${celebrationSearch(celebration)}`);
} catch (error) {
  document.documentElement.dataset.state = 'error';
  document.title = 'Unable to open celebration';
  createRoot(document.getElementById('root')).render(
    <MantineProvider><Center component="main" mih="100svh" p="lg">
      <Alert color="red" title="Unable to open celebration" role="alert">{error.message}</Alert>
    </Center></MantineProvider>,
  );
}
