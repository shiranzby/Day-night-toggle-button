# 🌗 Shiran Theme Toggle

精美的日夜主题切换按钮集合，附带 **涟漪扩散 (Ripple Reveal)** 全屏过渡动画。包含四种实现方案，适用于不同的页面架构和需求。

> 📖 **在线对比**: [shiranzby.github.io/Day-night-toggle-button](https://shiranzby.github.io/Day-night-toggle-button/) — 四版本并排实时对比 + 涟漪动画

[![四个版本对比](https://img.shields.io/badge/🌗-在线对比页面-blue?style=for-the-badge)](https://shiranzby.github.io/Day-night-toggle-button/)

---

## ✨ 四种方案对比

| 版本 | 独立文件 | 实现方式 | 星星闪烁 | 悬浮交互 | 特点 |
|------|---------|---------|---------|---------|------|
| **v1.0** | [查看源码](v1.0/index.html) | 纯 CSS/JS | JS `setTimeout` 循环 + `twinkle` class | 无 | 简单可靠，无 CSS 动画依赖 |
| **v2.0** | [查看源码](v2.0/index.html) | 纯 CSS/JS | CSS `@keyframes` 独立频率 | 星扩散 / 云膨胀 | 动画更流畅，hover 有反馈 |
| **v3.0** | [查看源码](v3.0/index.html) | Web Component | CSS `@keyframes` (Shadow DOM) | 同 v2.0 | 组件隔离，属性驱动 |
| **v4.0** | [查看源码](v4.0/index.html) | Web Component | CSS `@keyframes` (Shadow DOM) | 同 v2.0 | 同 v3 + 系统主题自动跟随 |

> 所有版本在[对比页](https://shiranzby.github.io/Day-night-toggle-button/)中并排展示，点击任意按钮其余三个自动跟随切换。

---

## 🎨 按钮视觉设计

按钮是一个完整的微缩场景，包含：

| 元素 | 日间 ☀️ | 夜间 🌙 |
|------|---------|---------|
| **主按钮** | 金色太阳 + 立体阴影 | 银灰月亮 + 三个陨石坑 |
| **轨道** | 蓝天 (`rgba(70,133,192)`) | 深空 (`rgba(25,30,50)`) |
| **光环** | 3 层半透明白色光环跟随 | 同步平移 |
| **云朵** | 6 朵白云可见 | 下沉隐藏 |
| **星星** | ✨ 隐藏 | 6 颗闪烁星星显现 |

全部纯 CSS/HTML 绘制，无图片依赖。

---

## 🌊 涟漪扩散动画

点击任意切换按钮时，**新主题从点击位置以圆形 ripple 向外扩散** — 圆到哪里，哪里变色。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 动画时长 | `1400ms` | `duration` |
| 缓动曲线 | `cubic-bezier(0.4, 0, 0.5, 1)` | 先快后稳，收尾干脆 |
| 半径计算 | `Math.hypot()` | 从点击点到屏幕最远角 |
| 实现 | View Transitions API + Web Animations API | `::view-transition-new(root)` 伪元素 |

**自定义缓动曲线：**

```javascript
// 搜索 index.html 中的 cubic-bezier 即可定位
easing: 'cubic-bezier(0.4, 0, 0.5, 1)'
//          P1(0.4,0) — 起步速度       P2(0.5,1) — 收尾速度
//          值越小起步越缓              值越大收尾越干脆
```

---

## 🚀 使用方式

### 单项引用 (v1/v2)

直接拷贝 [v1.0/index.html](v1.0/index.html) 或 [v2.0/index.html](v2.0/index.html) 中对应版本的 CSS 和 HTML 结构到你的项目中。v1 和 v2 无外部依赖，仅需 CSS + JS。

### Web Component 引用 (v3/v4)

```html
<theme-button value="light" size="3"></theme-button>
<script src="v4.0/theme-button.js"></script>
```

v4 额外支持 `prefers-color-scheme` 自动检测。

### 涟漪动画集成

需要 View Transitions API (Chrome 111+)：

```javascript
const vt = document.startViewTransition(() => toggleTheme());
vt.ready.then(() => {
  document.documentElement.animate(
    { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
    { duration: 1400, easing: 'cubic-bezier(0.4,0,0.5,1)',
      pseudoElement: '::view-transition-new(root)' }
  );
});
```

---

## 📁 文件

```
shiran-theme-toggle/
├── index.html       # 四版本并排对比页（GitHub Pages）
├── v1.0/index.html  # v1.0 独立页面 — JS 定时闪烁
├── v2.0/index.html  # v2.0 独立页面 — CSS 动画 + hover 扩散
├── v3.0/index.html  # v3.0 独立页面 — Web Component
├── v4.0/index.html  # v4.0 独立页面 — Web Component + 系统主题检测
├── README.md        # 本文档
├── LICENSE          # MIT
└── .gitignore
```

---

## 🙏 致谢

- **按钮视觉设计** — [Xiumuzaidiao/Day-night-toggle-button](https://github.com/Xiumuzaidiao/Day-night-toggle-button)，提供精美纯 CSS 日夜切换按钮

---

## 📝 License

MIT
