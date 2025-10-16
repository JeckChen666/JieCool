import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  // 说明：我们依赖已经在后台运行的本地开发服务器（npm run dev）。
  // 如需在测试启动时自动拉起，可启用下方配置，但需确保不会与现有 dev 服务器冲突。
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3000,
  //   reuseExistingServer: true,
  // },
});