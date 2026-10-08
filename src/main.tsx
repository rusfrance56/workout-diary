import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';
import App from './app/App';
import { ensureProgramSeed } from './db/seed';
import { applyTheme, readStoredTheme } from './utils/theme';

applyTheme(readStoredTheme());
registerSW({ immediate: true });

void ensureProgramSeed().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
