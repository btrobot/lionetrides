# DESIGN.md

## 品牌标识

- **公司名**：Lionet Rides
- **域名**：lionetrides.com
- **标语**：Where Thrills Begin（欢乐由此启程）
- **Logo**：狮子头像（橙色鬃毛）+ 蓝橙双色滑梯 + "Lionet RIDES" 文字
- **Logo 文件**：`/public/logo.png`
- **品牌色来源**：Logo 狮子鬃毛橙色 + 滑梯蓝色

## 项目画像
游乐设施（过山车、摩天轮、旋转木马、碰碰车、水上乐园设备、儿童游乐设施）B2B 制造与销售公司官网。目标客户：主题乐园、水上乐园、城市综合体、旅游景区。

## 色彩系统
- **主色**：蓝色 `#2563eb` (blue-600) — 专业信赖感
- **背景**：纯白 `#FFFFFF` + 浅灰 `#F9FAFB` 分段
- **文字**：深灰 `#111827` + 辅助灰 `#6B7280`
- **CTA**：白色按钮 + 蓝色文字，或蓝色按钮 + 白色文字
- **强调色**：橙色 `#F97316` (orange-500) — 询盘按钮、导航 hover 态
- **Hero 渐变**：from-blue-900 via-blue-700 to-indigo-900

## 字体
- **中文系统字体**：PingFang SC / Hiragino Sans GB / Microsoft YaHei / system-ui（系统字体栈）
- **英文字体**：Rubik（标题）+ Nunito Sans（正文），通过 Google Fonts 引入

## 布局与响应式
- 大区块呼吸感，`max-w-7xl` 居中布局
- 卡片无边框，圆角 `rounded-xl`，hover 阴影提升
- 响应式：移动端优先，lg 断点切换桌面端布局

## 设计风格
- 干净、明亮、愉悦 — 蓝色为主，白色为底，简洁通透
- Hero 全幅蓝色渐变背景，大标题 + 双 CTA
- 产品区域 fadeInUp 入场动画
- 链接 hover 蓝色，导航 hover 橙色

## 组件规范
- **Hero**：全幅渐变背景，大标题（text-4xl~5xl），副标题，双 CTA 按钮
- **统计卡片**：数字大号粗体，图标上方，带计数动画
- **产品卡片**：圆角卡片，hover 阴影 + 技术参数浮层，底部询盘按钮
- **分类卡片**：渐变色图标 + 分类名 + 子分类数
- **认证资质**：Logo 图标横向排列，半透明
- **合作伙伴 Logo 墙**：无限滚动，hover 暂停
- **询盘弹窗**：Dialog 组件，表单字段：姓名/邮箱/电话/公司/数量/留言

## 动效与交互
- 产品卡片 hover：阴影提升 + 参数浮层渐入
- 统计数字：计数动画（滚动到视口触发）
- 入场动画：fadeInUp（使用 intersection observer）
- 导航 hover：蓝色变橙色过渡
- Partner Logo：无限滚动轮播，hover 暂停

## 设计禁忌
- 禁止使用深色背景 + 白色文字的大段落排版
- 禁止使用过于花哨的渐变和装饰元素
- 禁止使用 emoji 作为 UI 图标（使用 Lucide 图标）
- 避免科技蓝+圆角卡片的万能模板感，加入工业制造场景的实感

---

# Admin Panel Design System

> Lionet Rides 管理后台设计规范
> 版本：v1.0 | 最后更新：2026-08-04

---

## 1. 设计哲学

### 1.1 核心原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **高效优先** | 减少操作步骤，提升管理效率 | 批量操作、快捷键支持 |
| **信息清晰** | 数据层级分明，重点突出 | 统计卡片、状态标签 |
| **一致性强** | 组件复用，模式统一 | 统一的表格、表单、弹窗 |
| **容错友好** | 操作可撤销，错误可恢复 | 删除确认、操作日志 |

### 1.2 设计灵感

- **Linear** — 极简高效的任务管理
- **Notion** — 灵活的块编辑器
- **Vercel Dashboard** — 清晰的数据展示
- **Stripe Dashboard** — 专业的金融级界面

---

## 2. 色彩系统

### 2.1 基础色板

```
┌─────────────────────────────────────────────────────────────┐
│  侧边栏背景                                                  │
│  from-slate-900 via-blue-950 to-slate-900                   │
│  #0F172A → #1E1B4B → #0F172A                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  内容区背景                                                  │
│  bg-slate-100  #F1F5F9                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  卡片背景                                                    │
│  bg-white  #FFFFFF                                          │
└─────────────────────────────────────────────────────────────
```

### 2.2 功能色

| 用途 | 颜色 | Tailwind | 使用场景 |
|------|------|----------|----------|
| **主色** | 蓝色 | `blue-500` `#3B82F6` | 主要按钮、链接、选中态 |
| **成功** | 绿色 | `green-500` `#22C55E` | 成功提示、已回复状态 |
| **警告** | 琥珀色 | `amber-500` `#F59E0B` | 待处理状态、警告提示 |
| **危险** | 红色 | `red-500` `#EF4444` | 删除按钮、错误提示 |
| **信息** | 青色 | `cyan-500` `#06B6D4` | 信息提示、处理中状态 |
| **次要** | 灰色 | `slate-500` `#64748B` | 次要文字、禁用态 |

### 2.3 统计卡片渐变

```typescript
const statCardGradients = {
  blue:   'from-blue-500 to-blue-700',      // 产品、用户
  purple: 'from-purple-500 to-purple-700',  // 新闻、订单
  cyan:   'from-cyan-500 to-cyan-700',      // 分类、标签
  orange: 'from-orange-500 to-orange-700',  // 询盘、消息
  green:  'from-green-500 to-green-700',    // 收入、增长
  rose:   'from-rose-500 to-rose-700',      // 评价、反馈
};
```

### 2.4 状态标签

| 状态 | 背景色 | 文字色 | 适用场景 |
|------|--------|--------|----------|
| `pending` | `bg-amber-100` | `text-amber-800` | 待处理、待审核 |
| `processing` | `bg-blue-100` | `text-blue-800` | 处理中、进行中 |
| `replied` | `bg-green-100` | `text-green-800` | 已回复、已完成 |
| `closed` | `bg-slate-100` | `text-slate-600` | 已关闭、已归档 |
| `urgent` | `bg-red-100` | `text-red-800` | 紧急、重要 |

---

## 3. 字体与排版

### 3.1 字体栈

```css
/* 中文优先 */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
             sans-serif;
```

### 3.2 字号规范

| 用途 | 字号 | 字重 | Tailwind |
|------|------|------|----------|
| 页面标题 | 24px | Bold | `text-2xl font-bold` |
| 卡片标题 | 18px | Semibold | `text-lg font-semibold` |
| 表格表头 | 12px | Semibold | `text-xs font-semibold uppercase tracking-wider` |
| 表格内容 | 14px | Regular | `text-sm` |
| 正文 | 14px | Regular | `text-sm` |
| 辅助文字 | 12px | Regular | `text-xs text-slate-500` |
| 统计数字 | 30px | Bold | `text-3xl font-bold` |

### 3.3 行高与间距

```
行高：
- 标题：1.2 (tight)
- 正文：1.5 (normal)
- 辅助：1.4

字间距：
- 表头：tracking-wider (0.05em)
- 标签：tracking-wide (0.025em)
- 普通：tracking-normal (0em)
```

---

## 4. 布局系统

### 4.1 整体结构

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Layout                                                │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │              Main Content                    │
│   240px      │              flex-1                          │
│   fixed      │              p-6 ~ p-8                       │
│              │                                              │
│              │  ┌──────────────────────────────────────┐   │
│              │  │  Page Header                         │   │
│              │  │  Title + Actions                     │   │
│              │  └──────────────────────────────────────┘   │
│              │                                              │
│              │  ──────────────────────────────────────┐   │
│              │  │  Stats Cards (Grid)                  │   │
│              │  │  4 columns on desktop                │   │
│              │  └──────────────────────────────────────┘   │
│              │                                              │
│              │  ──────────────────────────────────────┐   │
│              │  │  Data Table / Content                │   │
│              │  │  bg-white rounded-xl shadow-sm       │   │
│              │  └──────────────────────────────────────┘   │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 4.2 响应式断点

| 断点 | 宽度 | 布局变化 |
|------|------|----------|
| `sm` | 640px | 单列布局 |
| `md` | 768px | 双列网格 |
| `lg` | 1024px | 侧边栏展开，三列网格 |
| `xl` | 1280px | 四列网格 |
| `2xl` | 1536px | 最大宽度限制 |

### 4.3 间距系统

```
基础单位：4px (0.25rem)

间距层级：
- 0.5: 2px   (微间距)
- 1:   4px   (紧凑)
- 2:   8px   (默认)
- 3:   12px  (舒适)
- 4:   16px  (标准)
- 5:   20px  (宽松)
- 6:   24px  (大间距)
- 8:   32px  (区块)
- 10:  40px  (大区块)
- 12:  48px  (超大区块)

应用：
- 卡片内边距：p-5 (20px)
- 卡片间距：gap-6 (24px)
- 页面边距：p-6 ~ p-8 (24-32px)
- 区块间距：mb-8 ~ mb-12 (32-48px)
```

---

## 5. 组件规范

### 5.1 统计卡片 (Stat Card)

```tsx
// 结构
<div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
  <div className="flex items-center justify-between mb-4">
    <Package className="h-8 w-8 text-white/80" />
    <TrendingUp className="h-4 w-4 text-green-300" />
  </div>
  <div className="text-3xl font-bold mb-1">128</div>
  <div className="text-sm text-white/80">产品总数</div>
</div>
```

**变体**：
- 渐变背景（主要指标）
- 白色背景 + 彩色图标（次要指标）

### 5.2 数据表格 (Data Table)

```tsx
// 表头
<thead>
  <tr className="bg-slate-50 border-b border-slate-200">
    <th className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 text-left">
      名称
    </th>
  </tr>
</thead>

// 行
<tbody>
  <tr className="hover:bg-blue-50/50 transition-colors border-b border-slate-100">
    <td className="px-6 py-4 text-sm text-slate-700">内容</td>
  </tr>
</tbody>
```

**特性**：
- 表头固定（sticky top）
- 行 hover 高亮
- 斑马纹可选
- 空状态居中提示

### 5.3 操作按钮 (Action Button)

```tsx
// 主要按钮
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
  保存
</button>

// 次要按钮
<button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
  取消
</button>

// 危险按钮
<button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
  删除
</button>

// 图标按钮
<button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
  <Edit className="h-4 w-4" />
</button>
```

### 5.4 搜索框 (Search Input)

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
  <input
    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="搜索..."
  />
</div>
```

### 5.5 分页 (Pagination)

```tsx
<div className="flex items-center gap-2">
  <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
    上一页
  </button>
  <button className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">
    1
  </button>
  <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
    2
  </button>
  <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
    下一页
  </button>
</div>
```

### 5.6 弹窗 (Dialog/Modal)

```tsx
// 结构
<Dialog>
  <DialogContent className="sm:max-w-[600px] p-0">
    {/* 顶部品牌色条 */}
    <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-xl" />
    
    {/* 内容区 */}
    <div className="p-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">标题</DialogTitle>
        <DialogDescription className="text-sm text-slate-500">描述</DialogDescription>
      </DialogHeader>
      
      {/* 表单内容 */}
      <div className="mt-6 space-y-4">
        {/* 表单项 */}
      </div>
    </div>
    
    {/* 底部操作区 */}
    <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-100">
      <Button variant="outline">取消</Button>
      <Button>确认</Button>
    </div>
  </DialogContent>
</Dialog>
```

### 5.7 空状态 (Empty State)

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Package className="h-16 w-16 text-slate-300 mb-4" />
  <h3 className="text-lg font-medium text-slate-900 mb-1">暂无数据</h3>
  <p className="text-sm text-slate-500 mb-6">开始创建您的第一个产品</p>
  <Button>添加产品</Button>
</div>
```

### 5.8 加载状态 (Loading State)

```tsx
// 骨架屏
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-slate-200 rounded w-3/4" />
  <div className="h-4 bg-slate-200 rounded w-1/2" />
</div>

// 旋转加载
<div className="flex items-center justify-center py-8">
  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
</div>
```

---

## 6. 交互模式

### 6.1 导航模式

```
侧边栏导航：
├── 固定宽度 240px
├── 深色渐变背景
── 选中态：蓝色高亮 + 右侧圆点
├── Hover：白色/5 背景
└── 移动端：抽屉式，带遮罩
```

### 6.2 表单交互

| 场景 | 行为 |
|------|------|
| 输入聚焦 | 蓝色边框 + 阴影 |
| 验证错误 | 红色边框 + 错误提示 |
| 保存成功 | Toast 提示 + 自动刷新 |
| 保存失败 | 内联错误提示 |
| 离开未保存 | 确认对话框 |

### 6.3 表格交互

| 操作 | 行为 |
|------|------|
| 行点击 | 可选：展开详情/跳转编辑 |
| 行 hover | 浅蓝背景高亮 |
| 批量选择 | 复选框 + 顶部操作栏 |
| 排序 | 点击表头切换升/降序 |
| 筛选 | 顶部筛选栏 + 标签展示 |

### 6.4 快捷操作

```
键盘快捷键：
- Ctrl/Cmd + K: 全局搜索
- Ctrl/Cmd + N: 新建（根据当前页面）
- Ctrl/Cmd + S: 保存（表单页面）
- Escape: 关闭弹窗/取消选择
- G then P: 跳转到产品管理
- G then I: 跳转到询盘管理
```

---

## 7. 页面模板

### 7.1 控制台 (Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│  页面标题 + 时间范围选择器                                    │
├─────────────────────────────────────────────────────────────┤
│  统计卡片网格 (6 列)                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  │产品 │ │询盘 │ │用户 │ │新闻 │ │评价 │ │分类 │         │
│  ─────┘ └─────┘ ─────┘ └─────┘ ─────┘ └─────┘         │
├─────────────────────────────────────────────────────────────┤
│  快捷操作 (4 列)                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │添加产品  │ │处理询盘  │ │发布新闻  │ │网站设置  │      │
│  └──────────┘ └──────────┘ ──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  最近活动 / 待办事项                                         │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 列表页 (List Page)

```
┌─────────────────────────────────────────────────────────────┐
│  页面标题 + 新建按钮                                          │
├─────────────────────────────────────────────────────────────┤
│  筛选栏：搜索框 + 下拉筛选 + 日期范围                         │
├─────────────────────────────────────────────────────────────┤
│  批量操作栏（选中时显示）                                     │
├─────────────────────────────────────────────────────────────┤
│  数据表格                                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 表头                                                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 行 1                                                  │  │
│  │ 行 2                                                  │  │
│  │ ...                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  分页                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 编辑页 (Edit Page)

```
┌─────────────────────────────────────────────────────────────┐
│  返回按钮 + 页面标题 + 保存/取消按钮                          │
├─────────────────────────────────────────────────────────────┤
│  表单内容（分栏布局）                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ 基本信息            │ │ 详细信息            │           │
│  │                     │ │                     │           │
│  │ - 名称              │ │ - 描述              │           │
│  │ - 分类              │ │ - 规格              │           │
│  │ - 品牌              │ │ - 图片              │           │
│  ─────────────────────┘ └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 设计令牌 (Design Tokens)

### 8.1 CSS 变量

```css
:root {
  /* 颜色 */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #06B6D4;
  
  /* 背景 */
  --bg-sidebar: linear-gradient(to bottom, #0F172A, #1E1B4B, #0F172A);
  --bg-content: #F1F5F9;
  --bg-card: #FFFFFF;
  
  /* 文字 */
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --text-tertiary: #94A3B8;
  
  /* 边框 */
  --border-default: #E2E8F0;
  --border-light: #F1F5F9;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* 圆角 */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  
  /* 间距 */
  --spacing-xs: 0.5rem;   /* 8px */
  --spacing-sm: 0.75rem;  /* 12px */
  --spacing-md: 1rem;     /* 16px */
  --spacing-lg: 1.5rem;   /* 24px */
  --spacing-xl: 2rem;     /* 32px */
}
```

### 8.2 Tailwind 配置扩展

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        admin: {
          sidebar: '#0F172A',
          content: '#F1F5F9',
          card: '#FFFFFF',
        }
      },
      boxShadow: {
        'admin-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'admin-md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'admin-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      }
    }
  }
}
```

---

## 9. 无障碍 (Accessibility)

### 9.1 键盘导航

- 所有交互元素可通过 Tab 键访问
- 焦点状态清晰可见（蓝色轮廓）
- 支持 Escape 关闭弹窗

### 9.2 屏幕阅读器

- 使用语义化 HTML 标签
- 图标按钮添加 `aria-label`
- 状态变化使用 `aria-live`

### 9.3 对比度

- 文字与背景对比度 ≥ 4.5:1 (WCAG AA)
- 大号文字对比度 ≥ 3:1

---

## 10. 性能优化

### 10.1 加载策略

| 资源 | 策略 |
|------|------|
| 首屏数据 | 并行请求，骨架屏占位 |
| 图片 | 懒加载，WebP 格式 |
| 图表 | 按需加载，数据缓存 |
| 路由 | 代码分割，预加载 |

### 10.2 交互优化

- 操作反馈即时（乐观更新）
- 防抖/节流：搜索输入 300ms
- 虚拟滚动：长列表 > 100 项
- 缓存策略：SWR / React Query

---

## 11. 检查清单

### 11.1 开发前

- [ ] 确认页面类型（列表/编辑/详情）
- [ ] 确认数据结构和 API
- [ ] 确认用户角色和权限
- [ ] 选择对应模板

### 11.2 开发中

- [ ] 使用设计令牌，避免硬编码
- [ ] 响应式布局测试
- [ ] 空状态和加载状态
- [ ] 错误处理和用户提示

### 11.3 交付前

- [ ] 键盘导航测试
- [ ] 屏幕阅读器测试
- [ ] 性能测试（Lighthouse）
- [ ] 跨浏览器测试

---

## 附录：常用代码片段

### A. 页面标题组件

```tsx
function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </div>
  );
}
```

### B. 统计卡片组件

```tsx
function StatCard({ label, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-8 w-8 text-white/80" />
        {trend && <TrendingUp className="h-4 w-4 text-green-300" />}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  );
}
```

### C. 数据表格组件

```tsx
function DataTable<T>({ columns, data, loading, empty }: DataTableProps<T>) {
  if (loading) return <Skeleton />;
  if (data.length === 0) return <EmptyState />;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 text-left">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

**文档维护**：本规范随项目迭代持续更新，每次重大 UI 变更后同步修订。
