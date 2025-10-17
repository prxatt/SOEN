import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom']
      },
      esbuild: {
        // Skip TypeScript type checking for faster dev builds
        tsconfigRaw: {
          compilerOptions: {
            skipLibCheck: true,
            noUnusedLocals: false,
            noUnusedParameters: false,
            strict: false
          }
        }
      },
      build: {
        // Increase chunk size warning limit to reduce build warnings
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor chunks for better caching
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['framer-motion', 'lucide-react'],
              'ai-vendor': ['openai', '@google/genai', 'deepgram'],
              'supabase-vendor': ['@supabase/supabase-js']
            }
          }
        }
      }
    };
});
