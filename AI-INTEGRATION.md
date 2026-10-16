# v5.0：让 AI 给其他页面接入本主题控件

先读本文件，再读 [接口](docs/API.md) 和 [性能根因](docs/PERFORMANCE.md)。可直接让 AI “读取此仓库的 AGENTS.md 和 AI-INTEGRATION.md，为我的页面接入”。不要只把历史展示 HTML 粘贴到宿主。

`v5.0/index.html` 是共享组件的独立演示入口；真正复制/引用的运行时在 `components/` 与可选 `adapters/`，不是在版本目录维护第二份实现。根五版本对比页为演示同步使用iframe隔离，不是给宿主接入主题功能时必须添加iframe。

## 1. 接入前画清四个边界

| 需要确认 | 应得出什么 |
| --- | --- |
| 主题状态 | 当前是根 `data-theme`、`.dark` 类还是框架 store？只保留一个写入者 |
| 按钮外观 | 使用 `components/theme-button.js`，保留胶囊、太阳/月亮、云朵及悬停风格 |
| 揭示效果 | 普通桌面可验证 VT；超长页默认 `pageSize:'long'`，提前选择轻量路径，不等冻结后才超时 |
| 页面结构 | 正文、独立抽屉、滚动容器、代码、图片、表格分别归谁负责；不是按钮去修所有 DOM |

## 2. 最小普通 HTML 接入

先把 `components/` 和 `adapters/` 目录保持相对关系复制到目标静态资源目录。使用 HTTP(S) 服务打开，ES module 不以 `file://` 作为验收入口。

```html
<head>
  <!-- 在主题样式加载前执行，键名必须与控制器一致。严格 CSP 页面使用宿主 nonce/hash。 -->
  <script>
    (() => {
      let t;
      try { t = localStorage.getItem('my-site-theme'); } catch (_) {}
      if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = t;
    })();
  </script>
  <link rel="stylesheet" href="./components/theme-reveal.css">
  <style>
    :root { --bg:#fff; --fg:#1f2328; }
    :root[data-theme=dark] { --bg:#0d1117; --fg:#e6edf3; }
    body { margin:0; background:var(--bg); color:var(--fg); }
    header { position:relative; z-index:60; background:var(--bg); }
    /* 保留各类原配色；独立延迟的正文目标需要独立颜色值。 */
    #article p, #article h1, #article h2 { color:var(--fg); }
  </style>
</head>
<body>
  <header><theme-button size="1.8" aria-label="切换日夜主题"></theme-button></header>
  <main id="article" class="shiran-theme-content"><h1>页面标题</h1><p>页面原文</p></main>
  <script type="module">
    import {createThemeController} from './components/theme-controller.js';
    import {createFlowWave} from './adapters/flow-wave.js';
    const content=document.querySelector('#article');
    const header=document.querySelector('header');
    const wave=createFlowWave({content,shells:[document.body,header],targetSelector:'body,header,h1,h2,p'});
    const theme=createThemeController({storageKey:'my-site-theme',wave,surfaces:[header,content]});
    // 路由/页面卸载：theme.destroy(); 同时释放由它接管的 wave。
  </script>
</body>
```

`examples/basic.html` 是可运行版本。未提供 wave 时，`auto` 在不宜 VT 的环境直接换色，不会临时扫描整页，也不会悄悄用遮罩假装等价效果；要保留轻量圆盘/正文颜色波，按示例提供适配器。

## 3. 长文页面必须额外做的事

1. 明确配置 `pageSize:'long'`，即使宽屏也不自动赌 VT。若项目已在目标桌面证明 VT 可用，可显式设 `animation:'view-transition'`；这个选择需要宿主验收，不是通用建议。
2. 把固定目录/抽屉标记 `data-theme-static`，它用自身主题变量即时换色和独立 transform 滑动；不进入正文波。保持已加载/布局，隐藏时用 inert 等阻止交互。不能把会推动正文的布局变化也标成“不刷新”。
3. `targetSelector` 只列实际拥有独立配色的元素，不列代码 token 子树。不要默认收集 `*`。链接、语法颜色、选中态应保留宿主规则。
4. `.shiran-theme-content` 阅读层放在底色圆盘上方，底色透明；不透明整块阅读面会挡住圆盘，需适配其表面背景。检查 sticky/fixed、堆叠上下文、遮罩、弹窗、Canvas，不盲抄 z-index。
5. `backgrounds` 必须与宿主 body 的目标终态底色一致。圆盘保持不透明，背景落定后跨两次绘制机会撤层；不要加 opacity 淡出。
6. 代码块用局部横滚；准确行高与行数才可使用 `content-visibility` 占位。图片用真实尺寸/固定比例框，再标记 `data-theme-image-frame`；未知尺寸图不能这样标记骗过刷新。
7. 调整正文排版、字体加载、异步内容完成后调用 `wave.invalidate()`；增删直接子块调用 `wave.refresh()`。默认不会全章监听 DOM 突变，也不监听抽屉点击。

可运行示例：`examples/long-page.html`。它使用合成文本，不含 shydoc 原文；展示局部缓存、真实代码横滚、表格刷新、固定图片和常驻抽屉。

## 4. 有框架主题 store 的页面

只加载按钮模块，监听 `change` 的 `event.detail`（`light`/`dark`），交给已有 store；store 更新后设置按钮 `value` 属性。程序改 `value` 不派发 `change`，不会形成循环。

页面原先若用 `.dark` 类，不要同时启动一个写 `data-theme` 的控制器。可以迁移宿主 CSS 到 `data-theme`，也可以保留既有状态/渲染器只复用按钮；迁移不属于“复制三行就自动完成”的操作。跨路由需要在宿主生命周期清理监听与缓存。

## 5. 接入后的交付门槛

按 [验收说明](docs/VALIDATION.md) 分别报告：构建/语法、状态、浏览器交互、宽高/滚动、截图、目标手机实际体验。至少验证亮暗双向、快速反切、系统跟随与手动锁定、刷新、键盘、减少动态效果、长页深滚动、抽屉交叠、图片在途、代码/表格横滚、锚点与打印。

不要把本仓库合成示例通过，写成客户所有页面通过；不要把缓存计数归零，写成真机帧率或零卡顿保证。
