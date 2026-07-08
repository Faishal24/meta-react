import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { worker } from './mocks/browser';
import './index.css';

// Start the MSW worker, then render. Swap this out for a real backend by not
// starting the worker — the components use plain axios, so nothing else changes.
worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
