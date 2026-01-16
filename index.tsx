
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("CCJ Automator: [1/3] Module loaded, searching for root...");

const mountApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("CCJ Automator: [ERROR] Root element not found.");
    return;
  }

  try {
    console.log("CCJ Automator: [2/3] Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("CCJ Automator: [3/3] Rendering App...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("CCJ Automator: [CRITICAL ERROR]", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center; background: white; height: 100vh;">
        <h2 style="color: #e11d48; margin-bottom: 10px;">Dashboard Failed to Load</h2>
        <p style="color: #64748b; margin-bottom: 20px;">There was an error initializing the React application components.</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block; text-align: left; max-width: 80%;">
          <code style="color: #ef4444; font-size: 0.85rem;">${error?.message || "Unknown error"}</code>
        </div>
        <p style="margin-top: 20px; color: #94a3b8; font-size: 0.8rem;">Check the browser console (F12) for a full trace.</p>
      </div>
    `;
  }
};

// Start the app
mountApp();
