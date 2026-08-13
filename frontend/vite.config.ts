import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [
		react(),
	],

	server: {
		allowedHosts: true,

		proxy: {
			"/api": {
				target: "http://backend:3000",
				changeOrigin: true,
			},

			"/verify-email": {
				target: "http://backend:3000",
				changeOrigin: true,
			},

			"/setup-2fa": {
				target: "http://backend:3000",
				changeOrigin: true,
			},

			"/verify-2fa": {
				target: "http://backend:3000",
				changeOrigin: true,
			},
		},
	},
});