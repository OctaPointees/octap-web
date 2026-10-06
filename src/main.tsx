import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import OctaPAppEntryPoint from './app';

import './styles/index.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OctaPAppEntryPoint />
  </StrictMode>,
);
