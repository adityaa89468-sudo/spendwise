import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function getGradleVersion() {
  let versionName = '1.0.0';
  let versionCode = 100;
  try {
    const gradlePath = path.resolve(__dirname, 'android/app/build.gradle');
    if (fs.existsSync(gradlePath)) {
      const content = fs.readFileSync(gradlePath, 'utf-8');
      const nameMatch = content.match(/versionName\s+["']([^"']+)["']/);
      const codeMatch = content.match(/versionCode\s+(\d+)/);
      if (nameMatch && nameMatch[1]) {
        versionName = nameMatch[1].trim();
      }
      if (codeMatch && codeMatch[1]) {
        versionCode = parseInt(codeMatch[1].trim(), 10);
      }
    }
  } catch (e) {
    console.warn('Failed to read android/app/build.gradle for version info:', e);
  }
  return { versionName, versionCode };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const { versionName, versionCode } = getGradleVersion();

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__BUILD_GRADLE_VERSION_NAME__': JSON.stringify(versionName),
        '__BUILD_GRADLE_VERSION_CODE__': JSON.stringify(versionCode)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
