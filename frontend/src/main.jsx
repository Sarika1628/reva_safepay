import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { UserProvider } from './context/UserContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </AccessibilityProvider>
  </StrictMode>,
);
