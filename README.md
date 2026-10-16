# 🌗 Shiran Theme Toggle · v5.0

日夜主题切换按钮与页面揭示动效。**v5.0 是推荐接入版**：把按钮外观、主题状态和长页面适配分开，提供可复用组件、运行示例及 AI 接入指南；同时保留 v1.0～v4.0 历史演示。

> 📖 [五版本并排对比](https://shiranzby.github.io/Day-night-toggle-button/) · [v5.0 独立演示](https://shiranzby.github.io/Day-night-toggle-button/v5.0/) · [长页面示例](https://shiranzby.github.io/Day-night-toggle-button/examples/long-page.html)

## v5.0 更新

- 保留太阳、月亮、云朵及悬停视觉，移除常驻随机云朵定时器，悬停交互限于精细指针设备。
- 按钮只显示状态和派发用户事件；唯一控制器负责偏好保存、系统跟随、快速反切和卸载清理。
- 普通桌面按能力选择原生 View Transition；手机和超长页面提前采用局部颜色波与底色圆盘，避免全页快照阻塞。
- 点击只读取空闲缓存；抽屉开关、代码内部横滚和已固定尺寸的图片加载不误触发正文重建。
- 增加键盘、switch 语义、禁用状态及减少动态效果支持，并整理主题末帧、移动端宽度和宿主布局的适配边界。

v5.0 是共享模块的版本，不是把运行时再复制一份到版本目录：`v5.0/index.html` 引用 `components/` 和可选 `adapters/`，后续修复保持一个源码来源。

## 给新项目与 AI 的推荐入口

**新页面不要再复制整份演示 HTML**。v5.0 接入包是浏览器 ES module，无运行时第三方依赖。

| 入口 | 用途 |
| --- | --- |
| [AI-INTEGRATION.md](AI-INTEGRATION.md) | 其他 AI 首先阅读：普通页面/长页面/已有框架状态如何接入 |
| [components/theme-button.js](components/theme-button.js) | 按钮外观与用户事件，不扫描页面、不持久化或擅自跟随系统 |
| [components/theme-controller.js](components/theme-controller.js) + [CSS](components/theme-reveal.css) | 唯一主题状态、用户偏好、系统跟随、VT与轻量揭示、取消/销毁 |
| [adapters/flow-wave.js](adapters/flow-wave.js) | 普通流长文的局部坐标缓存，避免点击/抽屉动作扫描整章 |
| [普通页面示例](examples/basic.html) / [长页面示例](examples/long-page.html) | 实际可运行的接入方式；长页示例含常驻抽屉、代码/表格横滚与图片占位 |
| [性能根因与修复](docs/PERFORMANCE.md) | 卡顿的传递链、已验证做法、不可泛化的取舍与历史数据口径 |
| [接口](docs/API.md) / [验收](docs/VALIDATION.md) / [当前状态](PROGRESS.md) | API、测试方法、已验与未验边界 |
| [发布范围与流程](docs/UPLOAD-PLAN.md) | 上传文件、排除范围与版本发布边界 |

**核心结论：不是按钮大就卡，而是主题改变触发了整页快照、全量样式重算和无关缓存更新。** 新包把按钮外观、主题状态、页面揭示与宿主内容结构分开；长页提前避开昂贵快照，点击只读局部缓存，抽屉只显示已加载内容。

本地查看：在仓库目录运行 `python -m http.server 8000 --bind 127.0.0.1`，打开 `http://127.0.0.1:8000/` 看五版本对比，或 `/v5.0/` 看独立新版。不要用 `file://` 验收 ES module。`npm run check` 检查语法；浏览器检查见验收文档。对比页隔离新版与旧同名组件，并由父页面统一主题；它不是长页性能基准，独立 v5.0 和长页示例才展示新版的页面控制器。

[![五个版本对比](https://img.shields.io/badge/🌗-五版本在线对比-blue?style=for-the-badge)](https://shiranzby.github.io/Day-night-toggle-button/)

---

## ✨ 五种方案对比

| 版本 | 独立文件 | 实现方式 | 星星闪烁 | 悬浮交互 | 特点 |
|------|---------|---------|---------|---------|------|
| **v1.0** | [查看源码](v1.0/index.html) | 纯 CSS/JS | JS `setTimeout` 循环 + `twinkle` class | 无 | 简单可靠，无 CSS 动画依赖 |
| **v2.0** | [查看源码](v2.0/index.html) | 纯 CSS/JS | CSS `@keyframes` 独立频率 | 星扩散 / 云膨胀 | 动画更流畅，hover 有反馈 |
| **v3.0** | [查看源码](v3.0/index.html) | Web Component | CSS `@keyframes` (Shadow DOM) | 同 v2.0 | 组件隔离，属性驱动 |
| **v4.0** | [查看源码](v4.0/index.html) | Web Component | CSS `@keyframes` (Shadow DOM) | 同 v2.0 | 同 v3 + 系统主题自动跟随 |
| **v5.0（推荐）** | [独立演示](v5.0/index.html) / [组件](components/theme-button.js) | 独立组件 + 主题控制器 + 可选适配器 | 保留星形，不新增常驻星闪任务 | 精细指针悬停 | 手动偏好优先、长页轻量路径、局部缓存、无障碍与 AI 接入 |

> 五个版本在[对比页](https://shiranzby.github.io/Day-night-toggle-button/)中展示，点击任意按钮其余四个同步切换。窄屏自动换行，不撑大页面宽度。

---

## 🎨 按钮视觉设计

按钮是一个完整的微缩场景，包含：

| 元素 | 日间 ☀️ | 夜间 🌙 |
|------|---------|---------|
| **主按钮** | 金色太阳 + 立体阴影 | 银灰月亮 + 三个陨石坑 |
| **轨道** | 蓝天 (`rgba(70,133,192)`) | 深空 (`rgba(25,30,50)`) |
| **光环** | 3 层半透明白色光环跟随 | 同步平移 |
| **云朵** | 6 朵白云可见 | 下沉隐藏 |
| **星星** | ✨ 隐藏 | 6 颗星星显现；历史演示与 v5.0 的常驻动效不同，见上表 |

全部纯 CSS/HTML 绘制，无图片依赖。

---

## 🌊 涟漪扩散动画

本节描述历史演示及新版普通桌面路径的 VT 效果。v5.0 独立按钮本身不修改整页；控制器的长页轻量路径使用1300ms圆盘与按目标中心距离延迟的颜色波，不等同于逐像素硬边快照，策略和边界以 [接口说明](docs/API.md) 为准。

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

### v5.0 组件引用（推荐）

以下是新版独立组件入口；原 `v3.0/`、`v4.0/` 只有自包含 HTML，没有名为 `v4.0/theme-button.js` 的文件。页面主题的完整集成请按上面的 AI 接入指南，不与旧同名组件同时加载。

```html
<theme-button value="light" size="3"></theme-button>
<script type="module" src="components/theme-button.js"></script>
```

仅导入按钮不会修改页面主题。完整集成请读 [AI-INTEGRATION.md](AI-INTEGRATION.md)。旧v4演示内含系统跟随；v5.0 将它移交唯一页面控制器，避免覆盖用户手动选择。

### 涟漪动画集成

下列是旧演示的原理示意，不含取消/异常/减少动态效果和长页适配，不建议直接当生产接入代码。新版控制器用特性检测选择路径，不依赖固定浏览器版本号：

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
├── index.html       # 五版本并排对比页（GitHub Pages）
├── v1.0/index.html  # v1.0 独立页面 — JS 定时闪烁
├── v2.0/index.html  # v2.0 独立页面 — CSS 动画 + hover 扩散
├── v3.0/index.html  # v3.0 独立页面 — Web Component
├── v4.0/index.html  # v4.0 独立页面 — Web Component + 系统主题检测
├── v5.0/index.html  # v5.0 推荐演示 — 引用共享组件，无运行时复制
├── components/      # 可复用按钮、控制器和揭示样式
├── adapters/        # 可选普通流长文适配器
├── examples/        # 普通/长文接入示例
├── docs/            # 接口、性能根因和验收
├── tests/           # 独立浏览器回归
├── AI-INTEGRATION.md # 给后续AI的接入指南
├── AGENTS.md        # 工作边界和阅读顺序
├── README.md        # 本文档
├── LICENSE          # MIT
└── .gitignore
```

---

## 📝 License

MIT
