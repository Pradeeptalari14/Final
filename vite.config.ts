/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['login-logo.png', 'unicharm-logo.png'],
            manifest: {
                name: 'Unicharm Operations',
                short_name: 'UnicharmOps',
                description: 'Unicharm Operations Management System',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                    {
                        src: 'unicharm-logo.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'unicharm-logo.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5242880 // 5MB
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-recharts': ['recharts'],
                    'vendor-exceljs': ['exceljs'],
                    'vendor-lucide': ['lucide-react'],
                    'vendor-supabase': ['@supabase/supabase-js'],
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: false
    }
});
