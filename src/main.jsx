import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';
import { installGestureGuard } from './utils/gestureGuard.js';

registerSW({ immediate: true });
const removeGestureGuard = installGestureGuard();
if (import.meta.hot) import.meta.hot.dispose(removeGestureGuard);

createRoot(document.getElementById('root')).render(<App />);
