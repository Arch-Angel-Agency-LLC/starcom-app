import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const proxyConfig = [
    { apiPath: '/api/ucdp', envVar: 'VITE_UCDP_API_URL' },
    { apiPath: '/api/acled', envVar: 'VITE_ACLED_API_URL' },
    { apiPath: '/api/hot', envVar: 'VITE_HOT_API_URL' },
    // Add more proxies here
  ];

  const proxy = createProxies(proxyConfig, env, mode);

  return {
    plugins: [react()],
    build: {
      sourcemap: true,
    },
    server: {
      proxy,
    },
  };
});

/**
 * Utility to create proxies dynamically from configuration
 */
const createProxies = (
  config: Array<{ apiPath: string; envVar: string }>,
  env: Record<string, string>,
  mode: string
): Record<string, { target: string; changeOrigin: boolean; rewrite: (path: string) => string }> => {
  const proxies: Record<string, { target: string; changeOrigin: boolean; rewrite: (path: string) => string }> = {};

  config.forEach(({ apiPath, envVar }) => {
    const target = env[envVar];
    if (!target) {
      const message = `Environment variable ${envVar} is missing for ${apiPath}`;
      if (mode === 'development') {
        console.warn(`[WARN] ${message}`);
      } else {
        throw new Error(`[ERROR] ${message}`);
      }
    } else {
      proxies[apiPath] = createProxy(target, apiPath);
    }
  });

  return proxies;
};

/**
 * Create an individual proxy configuration
 */
const createProxy = (target: string, basePath: string) => ({
  target,
  changeOrigin: true,
  rewrite: (path: string) => path.replace(basePath, ''),
  secure: false, // Skip HTTPS checks for development
});