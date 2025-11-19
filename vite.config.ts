import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import process from 'node:process'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  //  env-files (.env, .env.development, .env.production и т.д.)
  const env = loadEnv(mode, process.cwd(), '')

  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

  return {
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        dirs: ['./src/composables/**'],
      }),
      Components({
        dts: true,
        directoryAsNamespace: true,
        collapseSamePrefixes: true,
        globalNamespaces: ['shadcn'],
        types: [
          {
            from: 'vue-router',
            names: ['RouterLink', 'RouterView'],
          },
        ],
        resolvers: [IconsResolver({ prefix: false })],
      }),
      Icons({ compiler: 'vue3' }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
