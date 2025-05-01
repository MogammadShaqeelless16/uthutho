import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load both .env and system env vars (like GitHub Actions secrets)
  const env = {
    ...process.env,                // System env (GitHub secrets)
    ...loadEnv(mode, process.cwd(), '')  // .env files
  };

  return {
    define: {
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
    },
  };
});