
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("CCJ Automator: Booting system...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CCJ Automator Error: Could not find the 'root' element in your index.html.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("CCJ Automator: Dashboard ready.");
  } catch (error) {
    console.error("CCJ Automator Launch Error:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center;">
        <h2 style="color: #e11d48;">Dashboard Loading Failed</h2>
        <p style="color: #64748b;">This usually happens if the browser blocks .tsx files or a file is missing.</p>
        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 20px;">Error: ${error.message}</p>
      </div>
    `;
  }
}
