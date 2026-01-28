import './style.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

console.log('Starting app...');

try {
  const rootElement = document.getElementById('app');
  if (!rootElement) throw new Error('Root element #app not found');

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('App mounted successfully');
} catch (error) {
  console.error('Failed to mount app:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>App Crashed</h1>
    <pre>${error instanceof Error ? error.message : String(error)}</pre>
  </div>`;
}
