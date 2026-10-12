import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { installGestureGuard } from './utils/gestureGuard.js';
import { observeAppUpdates } from './utils/updatePolicy.js';
import visualOverrides from './data/visual-overrides.json';
import { installVisualOverrides } from './utils/visualOverrides.js';

const editorRoute = import.meta.env.DEV && location.pathname.startsWith('/__editor');
if (!editorRoute) {
	const removeGestureGuard = installGestureGuard();
	const visuals = installVisualOverrides(document, visualOverrides);
	if (import.meta.hot) import.meta.hot.dispose(() => { removeGestureGuard(); visuals.dispose(); });
}

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

const root = createRoot(document.getElementById('root'));
if (import.meta.env.DEV && editorRoute) {
	import('./dev/VisualEditor.jsx').then(({ mountVisualEditor }) => mountVisualEditor(root));
} else root.render(<App />);
