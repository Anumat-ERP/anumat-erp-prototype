import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const ui = (path: string) =>
  fileURLToPath(new URL(`./src/ui/${path}`, import.meta.url));

// `vite build --mode artifact` makes one self-contained HTML page (inlined by
// scripts/build-artifact.mjs) for sharing as a claude.ai Artifact.
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site from /<repo>/; the workflow sets BASE_PATH.
  base: mode === 'artifact' ? './' : process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build:
    mode === 'artifact'
      ? {
          outDir: 'dist-artifact',
          assetsInlineLimit: 1e8,
          cssCodeSplit: false,
          chunkSizeWarningLimit: 1e4,
        }
      : {
          rollupOptions: {
            output: {
              // Keep third-party code in its own long-cached chunk.
              manualChunks: (id) => {
                if (id.includes('/node_modules/lottie-web/')) return 'lottie-vendor';
                if (/node_modules\/(?:@xyflow)/.test(id)) return 'flow-vendor';
                if (/node_modules\/(?:@tiptap|prosemirror-|orderedmap|rope-sequence|w3c-keyname)/.test(id)) return 'editor-vendor';
                return id.includes('node_modules') ? 'vendor' : undefined;
              },
            },
          },
        },
  resolve: {
    // App-owned UI components and layout tokens.
    alias: [
      { find: /^@app\/ui\/styles\/(.*)$/, replacement: ui('styles/$1') },
      { find: /^@app\/ui$/, replacement: ui('index.ts') },
    ],
  },
}));
