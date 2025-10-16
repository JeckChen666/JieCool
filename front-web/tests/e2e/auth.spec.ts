import { test, expect } from '@playwright/test';

const PASSWORD = process.env.TEST_PASSWORD || 'admin123';

test.describe('Auth & Protected Routes', () => {
  test('未登录访问受保护页面应重定向到 /login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/admin/config/manage');
    await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
  });

  test('登录成功（UI 表单）后跳转管理页并能看到操作按钮', async ({ page }) => {
    await page.goto('/login');
    // 输入密码并登录
    await page.getByPlaceholder('请输入密码').fill(PASSWORD);
    await page.getByRole('button', { name: '登录' }).click();

    // 跳转到管理页，看到“新增配置”按钮
    await expect(page.getByRole('heading', { name: '动态配置管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增配置' })).toBeVisible();
  });

  test('携带有效 token 访问 /api/auth/me 可返回当前用户信息', async ({ page, request }) => {
    // 先通过 UI 登录以获取令牌
    await page.goto('/login');
    await page.getByPlaceholder('请输入密码').fill(PASSWORD);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByRole('heading', { name: '动态配置管理' })).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    const res = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data?.user?.username).toBeTruthy();
  });

  test('token 过期后刷新应重定向到登录页（通过 ttl=3s 模拟）', async ({ page, request }) => {
    // 通过接口登录以设置短期令牌（非生产环境才会生效）
    const res = await request.post('/api/auth/login', {
      data: { password: PASSWORD, ttl: 3 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok()) {
      test.skip(true, '登录接口不可用或密码不匹配，跳过过期场景验证');
    }
    const data = await res.json();
    const token = data?.token as string;
    expect(token).toBeTruthy();

    // 将令牌放入 localStorage 后访问受保护页面
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/admin/config/manage');
    await expect(page.getByRole('heading', { name: '动态配置管理' })).toBeVisible();

    // 等待令牌过期，然后刷新触发路由守卫
    await page.waitForTimeout(4000);
    await page.reload();
    await expect(page.getByRole('heading', { name: '登录' })).toBeVisible();
  });
});

test.describe('Public (noAuth) Endpoints', () => {
  test('未登录时 /daily/sentence 与 /logs/visit 可访问', async ({ request }) => {
    const dailyRes = await request.get('http://localhost:8080/daily/sentence');
    expect(dailyRes.ok()).toBeTruthy();
    const dailyJson = await dailyRes.json();
    // 兼容后端统一响应结构 { code, message, data }
    const dailyData = dailyJson?.data ?? dailyJson;
    expect(
      dailyData?.sentence ||
      dailyData?.quote ||
      dailyData?.text ||
      dailyData?.content ||
      dailyData?.note ||
      dailyData?.translation
    ).toBeTruthy();

    const visitRes = await request.post('http://localhost:8080/logs/visit', {
      data: { path: '/' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(visitRes.ok()).toBeTruthy();
  });
});