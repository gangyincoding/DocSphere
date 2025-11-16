# 样式设计指南

本文档详细说明了 DocSphere 的设计系统、样式规范、UI 组件设计原则和最佳实践。

## 🎨 设计系统概述

### 设计原则

1. **一致性**: 整个应用的视觉和交互保持一致
2. **可用性**: 界面直观易用，用户能够快速上手
3. **可访问性**: 支持键盘导航，屏幕阅读器等辅助功能
4. **响应式**: 适配不同设备和屏幕尺寸
5. **性能**: 优化加载速度和渲染性能

### 核心价值

- **专业性**: 体现企业级应用的专业形象
- **效率性**: 帮助用户高效完成任务
- **可靠性**: 界面稳定可靠，给用户信任感
- **简洁性**: 避免不必要的复杂性，保持界面清爽

## 🎯 设计语言

### 色彩系统

#### 主色调
```css
:root {
  /* 主色 - 科技蓝 */
  --primary-color: #1890ff;
  --primary-color-hover: #40a9ff;
  --primary-color-active: #096dd9;
  --primary-color-bg: #f0f5ff;
  --primary-color-bg-hover: #e6f4ff;

  /* 成功色 */
  --success-color: #52c41a;
  --success-color-hover: #73d13d;
  --success-color-active: #389e0d;
  --success-color-bg: #f6ffed;

  /* 警告色 */
  --warning-color: #faad14;
  --warning-color-hover: #ffc53d;
  --warning-color-active: #d48806;
  --warning-color-bg: #fffbe6;

  /* 错误色 */
  --error-color: #ff4d4f;
  --error-color-hover: #ff7875;
  --error-color-active: #d9363e;
  --error-color-bg: #fff2f0;

  /* 信息色 */
  --info-color: #13c2c2;
  --info-color-hover: #36cfc9;
  --info-color-active: #08979c;
  --info-color-bg: #e6fffb;
}
```

#### 中性色
```css
:root {
  /* 文本色 */
  --text-color: #262626;
  --text-color-secondary: #8c8c8c;
  --text-color-disabled: #bfbfbf;
  --text-color-inverse: #ffffff;

  /* 背景色 */
  --background-color: #ffffff;
  --background-color-light: #fafafa;
  --background-color-container: #ffffff;
  --background-color-elevated: #ffffff;
  --background-color-spotlight: #ffffff;
  --background-color-layout: #f5f5f5;

  /* 边框色 */
  --border-color: #d9d9d9;
  --border-color-split: #f0f0f0;
  --border-color-disabled: #d9d9d9;
  --border-color-inverse: #ffffff;

  /* 阴影色 */
  --shadow-color: rgba(0, 0, 0, 0.15);
  --shadow-color-inverse: rgba(255, 255, 255, 0.85);
}
```

#### 语义化颜色
```css
:root {
  /* 文件类型颜色 */
  --file-color-document: #1890ff;
  --file-color-image: #52c41a;
  --file-color-video: #fa8c16;
  --file-color-audio: #722ed1;
  --file-color-archive: #f5222d;
  --file-color-code: #13c2c2;
  --file-color-spreadsheet: #52c41a;
  --file-color-presentation: #fa8c16;

  /* 状态色 */
  --status-online: #52c41a;
  --status-offline: #8c8c8c;
  --status-busy: #fa8c16;
  --status-away: #faad14;
}
```

### 字体系统

#### 字体族
```css
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
                 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                 'Noto Color Emoji';
  --font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
                     Courier, monospace;
}
```

#### 字体大小
```css
:root {
  --font-size-xs: 12px;    /* 辅助信息 */
  --font-size-sm: 14px;    /* 正文小 */
  --font-size-base: 16px;  /* 正文 */
  --font-size-lg: 18px;    /* 正文大 */
  --font-size-xl: 20px;    /* 小标题 */
  --font-size-xxl: 24px;   /* 标题 */
  --font-size-xxxl: 32px;  /* 大标题 */
  --font-size-xxxxl: 48px; /* 主标题 */
}
```

#### 字重
```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 间距系统

#### 基础间距
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-xxxl: 64px;
}
```

#### 语义化间距
```css
:root {
  --padding-xs: var(--spacing-xs);
  --padding-sm: var(--spacing-sm);
  --padding-md: var(--spacing-md);
  --padding-lg: var(--spacing-lg);
  --padding-xl: var(--spacing-xl);

  --margin-xs: var(--spacing-xs);
  --margin-sm: var(--spacing-sm);
  --margin-md: var(--spacing-md);
  --margin-lg: var(--spacing-lg);
  --margin-xl: var(--spacing-xl);
}
```

### 圆角和阴影

#### 圆角
```css
:root {
  --border-radius-xs: 2px;
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
  --border-radius-xl: 12px;
  --border-radius-xxl: 16px;
}
```

#### 阴影
```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

## 🎛️ 组件设计规范

### 按钮组件

#### 类型
```css
/* 主要按钮 */
.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-color-inverse);
}

/* 次要按钮 */
.btn-secondary {
  background-color: transparent;
  border-color: var(--border-color);
  color: var(--text-color);
}

/* 幽灵按钮 */
.btn-ghost {
  background-color: transparent;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 文本按钮 */
.btn-text {
  background-color: transparent;
  border-color: transparent;
  color: var(--primary-color);
}
```

#### 尺寸
```css
.btn {
  /* 小按钮 */
  &.btn-sm {
    height: 24px;
    padding: 0 7px;
    font-size: var(--font-size-sm);
  }

  /* 中等按钮 */
  &.btn-md {
    height: 32px;
    padding: 4px 15px;
    font-size: var(--font-size-base);
  }

  /* 大按钮 */
  &.btn-lg {
    height: 40px;
    padding: 6.4px 15px;
    font-size: var(--font-size-lg);
  }
}
```

### 表单组件

#### 输入框
```css
.input {
  height: 32px;
  padding: 4px 11px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  transition: border-color 0.3s, box-shadow 0.3s;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-bg);
    outline: none;
  }

  &:disabled {
    background-color: var(--background-color-light);
    color: var(--text-color-disabled);
    cursor: not-allowed;
  }

  &.error {
    border-color: var(--error-color);
  }
}
```

#### 选择器
```css
.select {
  position: relative;
  min-width: 200px;
  height: 32px;

  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 4px 11px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--background-color);
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary-color-hover);
    }
  }

  .select-arrow {
    transition: transform 0.3s;
  }

  &.open .select-arrow {
    transform: rotate(180deg);
  }
}
```

### 卡片组件

```css
.card {
  background-color: var(--background-color-container);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: var(--shadow-md);
  }

  .card-header {
    padding: var(--padding-md) var(--padding-lg);
    border-bottom: 1px solid var(--border-color-split);
    font-weight: var(--font-weight-medium);
  }

  .card-body {
    padding: var(--padding-lg);
  }

  .card-footer {
    padding: var(--padding-md) var(--padding-lg);
    border-top: 1px solid var(--border-color-split);
  }
}
```

## 🎨 布局系统

### 网格系统

#### 基础网格
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 calc(-1 * var(--spacing-sm));
}

.col {
  flex: 1;
  padding: 0 var(--spacing-sm);
}

/* 响应式列 */
.col-sm-6 { width: 50%; }
.col-md-4 { width: 33.333333%; }
.col-lg-3 { width: 25%; }
```

#### Flexbox 工具类
```css
.flex { display: flex; }
.flex-column { flex-direction: column; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.align-center { align-items: center; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
```

### 页面布局

```css
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
  background-color: var(--background-color-container);
  box-shadow: var(--shadow-sm);
}

.app-sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 256px;
  background-color: var(--background-color-container);
  border-right: 1px solid var(--border-color-split);
}

.app-main {
  margin-left: 256px;
  margin-top: 64px;
  padding: var(--spacing-lg);
  flex: 1;
}
```

## 📱 响应式设计

### 断点系统

```css
:root {
  --breakpoint-xs: 480px;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-xxl: 1600px;
}
```

### 媒体查询

```css
/* 移动设备优先 */
.responsive-component {
  /* 默认样式（移动设备） */
  padding: var(--spacing-sm);

  /* 平板 */
  @media (min-width: 768px) {
    padding: var(--spacing-md);
  }

  /* 桌面 */
  @media (min-width: 1024px) {
    padding: var(--spacing-lg);
  }
}

/* 隐藏/显示工具类 */
.hidden-xs { display: block; }
.visible-xs { display: none; }

@media (min-width: 576px) {
  .hidden-xs { display: none; }
  .visible-xs { display: block; }
}
```

### 移动端适配

```css
/* 触摸友好 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* 移动端导航 */
.mobile-menu {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu {
    display: flex;
  }

  .desktop-menu {
    display: none;
  }
}
```

## 🌙 主题系统

### 明暗主题

```css
/* 默认主题（亮色） */
[data-theme="light"] {
  --text-color: #262626;
  --text-color-secondary: #8c8c8c;
  --background-color: #ffffff;
  --background-color-light: #fafafa;
  --border-color: #d9d9d9;
}

/* 暗色主题 */
[data-theme="dark"] {
  --text-color: #ffffff;
  --text-color-secondary: #a6a6a6;
  --background-color: #141414;
  --background-color-light: #1f1f1f;
  --border-color: #434343;
}

/* 主题切换动画 */
* {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease;
}
```

### 自定义主题

```css
/* 企业定制主题 */
[data-theme="enterprise"] {
  --primary-color: #2f54eb;
  --secondary-color: #722ed1;
  --success-color: #52c41a;
  --warning-color: #fa8c16;
  --error-color: #f5222d;
}
```

## 🎯 动画系统

### 过渡动画

```css
/* 基础过渡 */
.transition {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.transition-colors {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

.transition-transform {
  transition: transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}
```

### 缓动函数

```css
:root {
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-out: cubic-bezier(0.215, 0.610, 0.355, 1.000);
  --ease-in: cubic-bezier(0.550, 0.055, 0.675, 0.190);
  --ease-back: cubic-bezier(0.680, -0.550, 0.265, 1.550);
}
```

### 常用动画

```css
/* 淡入淡出 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* 滑入 */
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 缩放 */
@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

## ♿ 可访问性

### 焦点样式

```css
/* 焦点指示器 */
.focusable:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .focusable:focus {
    outline-width: 3px;
  }
}
```

### 屏幕阅读器支持

```css
/* 屏幕阅读器专用内容 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-color);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

### 动画偏好

```css
/* 尊重用户的动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 🛠️ CSS 工具类

### 间距工具类

```css
/* 内边距 */
.p-0 { padding: 0; }
.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }

/* 外边距 */
.m-0 { margin: 0; }
.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }

/* 方向性间距 */
.mt-sm { margin-top: var(--spacing-sm); }
.mr-md { margin-right: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }
.ml-xl { margin-left: var(--spacing-xl); }
```

### 显示工具类

```css
.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-block { display: inline-block; }
.d-flex { display: flex; }
.d-grid { display: grid; }

/* 定位 */
.pos-relative { position: relative; }
.pos-absolute { position: absolute; }
.pos-fixed { position: fixed; }
.pos-sticky { position: sticky; }
```

### 文本工具类

```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }

.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-bold { font-weight: var(--font-weight-bold); }
```

## 📐 代码规范

### CSS 类命名

使用 BEM (Block, Element, Modifier) 命名规范：

```css
/* 块 (Block) */
.file-upload { }

/* 元素 (Element) */
.file-upload__button { }
.file-upload__progress { }
.file-upload__preview { }

/* 修饰符 (Modifier) */
.file-upload--disabled { }
.file-upload__button--primary { }
.file-upload__progress--visible { }
```

### CSS 变量使用

```css
/* ✅ 使用 CSS 变量 */
.component {
  color: var(--text-color);
  background-color: var(--background-color);
  padding: var(--spacing-md);
}

/* ❌ 避免硬编码值 */
.component {
  color: #262626;
  background-color: #ffffff;
  padding: 16px;
}
```

### 样式组织

```css
/* 按照以下顺序组织样式 */
.component {
  /* 1. 布局属性 */
  display: flex;
  position: relative;
  width: 100%;

  /* 2. 盒模型 */
  padding: var(--spacing-md);
  margin: var(--spacing-sm);
  border: 1px solid var(--border-color);

  /* 3. 视觉属性 */
  background-color: var(--background-color);
  color: var(--text-color);
  border-radius: var(--border-radius-md);

  /* 4. 动画属性 */
  transition: all 0.3s ease;

  /* 5. 伪类 */
  &:hover {
    background-color: var(--background-color-light);
  }

  &:focus {
    outline: 2px solid var(--primary-color);
  }
}
```

## 🎨 设计工具

### Figma 设计系统

1. **组件库**: 建立完整的设计组件库
2. **样式指南**: 包含颜色、字体、间距等设计令牌
3. **页面模板**: 常见页面布局模板
4. **设计规范**: 详细的设计使用规范

### 设计令牌

```json
{
  "colors": {
    "primary": "#1890ff",
    "success": "#52c41a",
    "warning": "#faad14",
    "error": "#ff4d4f"
  },
  "typography": {
    "fontFamily": "-apple-system, BlinkMacSystemFont, sans-serif",
    "fontSize": {
      "xs": 12,
      "sm": 14,
      "base": 16,
      "lg": 18,
      "xl": 20
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  }
}
```

## 📚 资源和工具

### 推荐工具

1. **CSS 预处理器**: Less/Sass
2. **PostCSS**: 自动添加浏览器前缀
3. **Stylelint**: CSS 代码检查
4. **PurgeCSS**: 删除未使用的 CSS
5. **Autoprefixer**: 自动添加浏览器前缀

### 在线工具

1. **Coolors.co**: 配色方案生成器
2. **Google Fonts**: 字体选择器
3. **Can I Use**: CSS 兼容性检查
4. **CSS Tricks**: CSS 技术文章

### 学习资源

1. [MDN Web Docs - CSS](https://developer.mozilla.org/zh-CN/docs/Web/CSS)
2. [CSS-Tricks](https://css-tricks.com/)
3. [Flexbox Froggy](https://flexboxfroggy.com/)
4. [Grid Garden](https://cssgridgarden.com/)

---

通过遵循本设计指南，您可以创建出一致、美观、可访问的用户界面。记住，好的设计不仅关注美观，更注重用户体验和可用性！🎨