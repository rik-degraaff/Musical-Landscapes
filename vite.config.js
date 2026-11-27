import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualEditorPlugin } from './scripts/visual-editor-plugin.mjs';
import { fileURLToPath } from 'node:url';

export default defineConfig(({mode})=>({
	define:mode==='production-test'?{
		'import.meta.env.VITE_FARMJAM_EDITIONS':JSON.stringify('false'),
	}:undefined,
	build: {
		outDir:mode==='production-test'?'dist-test':'dist',
		rolldownOptions:{input:{
			farmjam:fileURLToPath(new URL('./index.html',import.meta.url)),
			parentAccount:fileURLToPath(new URL('./parent-account.html',import.meta.url)),
		}},
	},
	plugins: [
		visualEditorPlugin(),
		react(),
		VitePWA({
			registerType: 'prompt',
			injectRegister: false,
			includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
			manifest: {
				name: 'FarmJam',
				short_name: 'FarmJam',
				description: 'Make music with an illustrated band, discover animal visitors, and ride between musical landscapes.',
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
				skipWaiting: false,
				clientsClaim: false,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,mp3,wav,flac}'],
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
			},
		}),
	],
}));
