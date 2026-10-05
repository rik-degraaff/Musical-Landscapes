import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
			manifest: {
				name: 'FarmJam',
				short_name: 'FarmJam',
				description: 'Make a tiny musical world. Tap, drag, and mix six playful instruments across changing landscapes.',
				theme_color: '#9ed8ef',
				background_color: '#9ed8ef',
				display: 'standalone',
				orientation: 'landscape',
				start_url: '/',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp3,wav,flac}'],
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
			},
		}),
	],
});
