前端路由记录规范（Next.js App Router）

背景
- 测试页面（src/app/test/page.tsx）用于展示并快速跳转到所有前端页面路径，便于开发、测试与验收。
- 为保证路径持续可见与可测试，制定如下规范：

规范
1) 每次新增页面/路由，必须在测试页面的 routes 数组中新增一条记录：
   - 字段：name（中文名）、path（路径）
   - 中文名应与 Navbar/页面标题保持一致，便于识别
   - 路径使用 Next.js App Router 的实际访问路径（例如 /file-management、/daily）

2) 测试页渲染要求：
   - 使用 Arco Design 的 Table 组件展示两列：中文名、路径
   - 路径列使用 next/link 进行跳转
   - 禁用分页（pagination=false），保证所有路径一目了然

3) 维护位置：
   - 代码文件：front-web/src/app/test/page.tsx
   - routes 数组为单一信息源，新增路径时仅需在此处添加记录

4) 命名与一致性：
   - name 与 Navbar 展示标题保持一致
   - 若页面在 Navbar 中可点击，测试页也必须包含该路径

5) 提交流程检查清单（Checklist）：
   - [ ] 新页面/路由已创建（app 路由目录或动态路由）
   - [ ] 在 src/app/test/page.tsx 的 routes 数组中新增记录（name、path）
   - [ ] 本地运行验证：测试页面能显示该路径，点击可正常跳转
   - [ ] 若页面出现在 Navbar，下拉或菜单项与测试页条目名称一致

示例
```tsx
// 片段：src/app/test/page.tsx
const routes = [
  { path: '/', name: '首页' },
  { path: '/file-management', name: '文件管理' },
  { path: '/test', name: '测试页面' },
  // 新增页面时务必补充：
  { path: '/new-page', name: '新页面' },
];
```

备注
- 若后续需要避免多处维护（例如 Navbar 与测试页重复维护路径），可以将 routes 抽取为共享模块（如 front-web/src/app/routes.ts），由测试页与 Navbar 共同引用，以确保一致性与可维护性。