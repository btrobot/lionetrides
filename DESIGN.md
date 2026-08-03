# DESIGN.md

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

## 管理后台设计规范（Admin Panel）

### 设计定位
内部管理工具，追求专业、高效、精致。灵感源：Linear / Notion / Vercel Dashboard 的极简高效风格，加入工业品牌的深蓝底色。

### 布局
- **侧边栏**：固定宽 240px，深色渐变背景（from-slate-900 via-blue-950 to-slate-900），白色文字，选中态蓝色高亮
- **顶栏**：白色背景，移动端显示汉堡菜单 + 品牌名
- **内容区**：浅灰背景 `#F1F5F9`，内边距 p-6~p-8
- **卡片**：白色背景，圆角 `rounded-xl`，边框 `border border-gray-100`，阴影 `shadow-sm` hover 提升至 `shadow-md`

### 色彩系统（管理后台）
- **侧边栏背景**：深蓝渐变 `from-slate-900 via-blue-950 to-slate-900`
- **侧边栏文字**：白色 `#FFFFFF`，不活跃态 `#94A3B8`
- **侧边栏活跃**：蓝色 `#3B82F6` 背景，白色文字
- **内容区背景**：`#F1F5F9` (slate-100)
- **卡片背景**：纯白 `#FFFFFF`
- **统计卡片渐变**：蓝 `from-blue-500 to-blue-700`、紫 `from-purple-500 to-purple-700`、青 `from-cyan-500 to-cyan-700`、橙 `from-orange-500 to-orange-700`
- **表格行 hover**：`hover:bg-blue-50/50` 过渡
- **状态标签**：pending → 琥珀色、processing → 蓝色、replied → 绿色、closed → 灰色

### 组件规范
- **统计卡片**：渐变背景 + 白色文字，大号数字 + 图标 + 趋势指示
- **数据表格**：表头灰色背景 `bg-slate-50`，文字 `text-xs font-semibold text-slate-500 uppercase tracking-wider`，行圆角分隔，hover 蓝色极浅背景
- **操作按钮**：圆角 `rounded-lg`，图标 + 文字，hover 阴影提升
- **搜索框**：左侧图标，圆角 `rounded-lg`，边框 `border-slate-200`
- **分页**：圆角按钮，当前页蓝色填充，hover 灰色背景
- **弹窗**：去除默认 padding，卡片式内容，顶部品牌色条装饰
- **空状态**：居中图标 + 灰色文字 + 操作按钮

### 字体与排版
- **页面标题**：`text-2xl font-bold text-slate-900`
- **表格表头**：`text-xs font-semibold text-slate-500 uppercase tracking-wider`
- **表格内容**：`text-sm text-slate-700`
- **统计数字**：`text-3xl font-bold` 白色
- **统计标签**：`text-sm font-medium` 白色/80% 透明度

### 动效
- 侧边栏切换：`duration-200` 平滑过渡
- 卡片 hover：`shadow-sm` → `shadow-md`，`transition-shadow duration-200`
- 表格行 hover：背景色 `transition-colors duration-150`
- 按钮点击：`active:scale-95` 微反馈
- 加载态：骨架屏或 pulse 动画