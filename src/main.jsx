import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { installGestureGuard } from './utils/gestureGuard.js';
import { observeAppUpdates } from './utils/updatePolicy.js';

const removeGestureGuard = installGestureGuard();
if (import.meta.hot) import.meta.hot.dispose(removeGestureGuard);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
	let disposed = false;
	let removeAppUpdates;
	navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
		.then(registration => {
			if (!disposed) removeAppUpdates = observeAppUpdates(registration, navigator.serviceWorker);
		})
		.catch(error => console.warn('App update registration failed', error));
	if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; removeAppUpdates?.(); });
}

createRoot(document.getElementById('root')).render(<App />);
