import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config
    define: {
      __APP_ENV__: env.APP_ENV
    },
    root: "src",
    envDir: "../", // Ensure env files are loaded from project root
    server: {
      proxy: {
        '/saavn-api': {
          target: 'https://saavn.sumit.co',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/saavn-api/, '')
        }
      }
    }
  }
})
