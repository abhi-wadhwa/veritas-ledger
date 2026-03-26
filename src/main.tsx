import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:20px;font-size:14px;white-space:pre-wrap">ERROR: ${e.message}\n\n${e.filename}:${e.lineno}\n\n${e.error?.stack || ''}</pre>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root')!.innerHTML =
    `<pre style="color:red;padding:20px;font-size:14px;white-space:pre-wrap">UNHANDLED REJECTION: ${e.reason}\n\n${e.reason?.stack || ''}</pre>`;
});

createRoot(document.getElementById('root')!).render(<App />);
