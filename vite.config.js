import { defineConfig, loadEnv } from 'vite'
import path from 'path'

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
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/index.html'),
          login: path.resolve(__dirname, 'src/login/login.html'),
          dashboard: path.resolve(__dirname, 'src/dashboard/dashboard.html'),
          account: path.resolve(__dirname, 'src/pages/account/account.html'),
          profile: path.resolve(__dirname, 'src/pages/profile/profile.html'),
          support: path.resolve(__dirname, 'src/pages/support/support.html'),
        }
      }
    },
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
