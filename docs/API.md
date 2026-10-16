# v5.0 接口契约

所有运行时文件是无第三方依赖的浏览器 ES module；无需构建。历史 `v4.0/index.html` 不是可直接 `src` 引用的 JS 文件。

## 按钮：`components/theme-button.js`

导入后注册 `<theme-button>`；不要再同时加载旧版同名组件。closed Shadow DOM 只隔离外观，不替宿主负责主题状态。

| 接口 | 约定 |
| --- | --- |
| `value="light|dark"` | 当前显示状态；程序修改静默，不派 `change` |
| `size="1.8"` | 沿用原比例：轨道宽约 `size×60px`、高约 `size×(70/3)px` |
| `disabled` | 有属性即禁用点击/键盘，暴露 `aria-disabled` |
| `aria-label` | 宿主可提供中文名称；组件默认具备 switch 语义与 `aria-checked` |
| `change` | 用户动作才派发，`detail` 为 `light` 或 `dark`；冒泡且跨 Shadow DOM |
| Enter / Space | 等价于一次切换；程序 `.click()` 也遵守 disabled |

默认移除常驻随机云朵定时器，hover仅在精细指针且支持悬停时运行，减少动态效果时禁用内部过渡。与旧演示的常驻微动不承诺逐帧相同；太阳/月亮/云朵等视觉结构保留。

## 控制器：`createThemeController(options)`

从 `components/theme-controller.js` 导入。在 body 建立后创建；每个 document 只允许一个。默认写 `documentElement.dataset.theme` 和 `style.colorScheme`，不改正文、不切 `.dark` 类。

| 选项 | 默认 / 作用 |
| --- | --- |
| `buttons` | 当前文档所有 `theme-button`；可传元素数组；创建后新增按钮需由宿主重新管理 |
| `storageKey` | `shiran-theme`；首屏 bootstrap 必须使用同键 |
| `animation` | `auto` / `view-transition` / `ripple` / `none` |
| `pageSize` | 普通页面；设 `'long'` 让 auto 提前避开长页 VT |
| `wave` | 可选坐标适配器；显式 ripple 必须提供；销毁时由控制器接管释放 |
| `surfaces` | 缓存尚未就绪时使用的固定少量容器；不在点击中测量正文 |
| `backgrounds` | `{light:'#ffffff',dark:'#0d1117'}`；必须等于宿主画布终态底色 |
| `filterSelector` | 默认不设；仅当宿主已用filter实现整块代码换色时，给对应目标用1ms到点翻转，禁止套到媒体/整页 |
| `root` | 默认且仅支持当前页面根 documentElement；不是局部区域动效 API |

`auto`：减少动态效果时直接换色；长页/≤1023px/粗指针环境优先 wave，没 wave 则直接换色；普通宽屏有原生 API 时使用 VT，其余使用 wave 或直接换色。不会依据低 `hardwareConcurrency` 数字就断言设备慢。显式 VT 仍尊重减少动态效果；它是宿主自行验收后的选择。

- `controller.theme`：最后请求的主题意图；VT 捕获期间，根属性可能稍后才落地。
- `controller.preference`：`light`/`dark` 为手动偏好，`null` 为系统跟随。
- `await controller.setTheme('dark', {persist:true, animate:true, point:{x:0,y:0}})`：默认保存手动偏好。返回 `{theme,cancelled,mode}`；0坐标合法。被后续请求取消的 Promise 也会收束。
- `await controller.followSystem()`：清除手动偏好，按当前系统主题切换；以后系统变化不写手动偏好，也不沿用旧点击位置。
- `controller.destroy()`：取消动画、收束状态、恢复临时 transition、移除覆盖层及所有监听、销毁 wave；保留当前主题与用户选择，不删除数据。再次创建控制器可继续使用。

捕获按钮自己的点击坐标，不在文档捕获所有点击。系统和键盘切换使用默认中心上方坐标。localStorage不可用时仍可在当前页工作；跨标签页 storage 事件会同步偏好。

## 普通流适配器：`createFlowWave(options)`

从 `adapters/flow-wave.js` 导入。仅用于直接子块按纵向普通流排序的页面；不直接适配虚拟列表、多列、绝对定位或重排布局。

| 选项 | 约定 |
| --- | --- |
| `content` | 正文元素；索引其直接子块，不全章扫描后代 |
| `shells` | 小型顶栏/可见大纲等；body/html只收自身，不递归正文 |
| `targetSelector` | 必填，实际需要独立换色的目标选择器；不得使用 `*` 作为默认 |
| `excludeSelector` | 默认 `[data-theme-static],pre *`；排除静态抽屉和代码后代 |
| `ignoreScrollSelector` | 默认 `[data-theme-static],pre`；这些内部滚动不刷新正文坐标 |
| `fixedImageSelector` | 默认 `[data-theme-image-frame] > img`；宿主必须保证其几何固定 |

- `getTargets()`：返回当前 `Map<Element,{left,top,width,height}>`。只读使用；不扫描、不补测。控制器复制 Map 后消费。
- `invalidate(delay=140)`：立即断开旧观察器/清坐标，延迟到空闲期重新选择；尺寸、字体、布局变化后调用。
- `refresh()`：重建直接子块索引并安排空闲选择；初次自动调用，动态增删后宿主再调用。
- `stats()`：只读 `created/disconnected/geometry/targets` 操作计数，用于局部诊断，不是耗时/帧率，也不收集正文或URL。
- `destroy()`：释放计时器、idle、监听和观察器，幂等。

自动失效：真实正文滚动、resize、相关details切换、未知尺寸图片load。不会因抽屉开关、代码内部滚动、固定图片load而失效；表格横滚保留。异步添加搜索结果、字体加载、框架路由变化等由宿主主动通知，不启用全章 MutationObserver。

颜色波会临时替换所选目标的 `transition` 并恢复原inline值及priority。带独立transform/布局动画的模块应排除出正文波，不能同时争用同一个transition；常驻抽屉就是这种情况。
