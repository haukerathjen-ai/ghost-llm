import { defineConfig } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  return {
    main: {
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          },
          output: {
            format: 'cjs'
          },
          external: ['electron']
        }
      },
      resolve: {
        alias: {
          '@shared': resolve(__dirname, '../../shared')
        }
      }
    },
    preload: {
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/preload/index.ts')
          },
          external: ['electron']
        }
      },
      resolve: {
        alias: {
          '@shared': resolve(__dirname, '../../shared')
        }
      }
    },
    renderer: {
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/renderer/index.html')
          }
        }
      }
    }
    // Note: We have a minimal renderer config to satisfy electron-vite,
    // but we use Next.js for the actual UI
  };
});
