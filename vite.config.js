import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/ARP/', // Repository name for GitHub Pages
    build: {
        outDir: 'dist',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
