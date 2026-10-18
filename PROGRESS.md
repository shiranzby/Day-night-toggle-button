# v5.0 当前交付

当前状态（2026-10-19）：用户已授权将点击坐标修复推送 GitHub，本地验证完成且远端无新增提交，正在正常发布 `master`；Pages 对应提交及线上交互尚待发布后核验。下方2026-10-16发布记录为历史，不能用来声称本轮已上线。

## 2026-10-19 本次激活坐标修复

- 根因：按钮构造时先注册capture click并同步派发change；控制器和嵌入演示后注册的同宿主capture click来不及记录本次坐标，导致首击回退默认点、后续动作沿用上一次点，键盘也可能残留。
- 最小修复：按钮在change上附加本次 `event.point`（client视口坐标，键盘/程序click为null），保持原detail字符串；控制器及iframe桥直接消费，删除额外click监听与坐标缓存。原按钮视觉、历史v1～v4文件及LICENSE未改。
- 独立Chromium151、390×844触摸/1440×844鼠标：定向反例旧实现16项失败，修复后两尺寸各10项通过，页面错误0；覆盖首击两端、快速第二击、Enter/Space、程序click、销毁解绑及iframe传点。报告在ignored `test-results/coordinates-before.json` / `coordinates-after.json`。
- 阶段验证：`npm run check`、`tests/browser_smoke.py`、`tests/version_smoke.py`均通过；保留持久化、系统跟随、减少动态、快速反切、抽屉与正文缓存解耦、滚动/图片/表格边界。不是目标手机真机或生产shydoc验收。
- 发布定向脚本支持 `--base`，可直接验收 GitHub Pages 的实际资源；不把本地临时服务结果冒充线上结果。保持 v1～v4、LICENSE 不变，不发布标签、GitHub Release 或 npm。

## 2026-10-16 已发布版本归档

日期：2026-10-16。目标：发布v5.0独立组件与AI接入资料，更新五版本对比页及README，按用户明确授权上传原GitHub仓库。

## 已整理

- 保留 `v1.0/`～`v4.0/` 独立文件；根 `index.html` 加入第5项及手机响应式布局。v5通过同源iframe隔离旧同名组件，嵌入分支只有按钮，由父页面统一状态。
- `v5.0/` 为新版独立演示，引用共享运行时；`package.json` 版本为5.0.0，仍private，不发布npm。
- README更新为v5.0推荐入口、五版本对比、示例链接和接入说明；按要求移除致谢展示段，LICENSE版权与许可条款不变。
- 新组件：`components/theme-button.js`（外观/事件）、`components/theme-controller.js`（状态/持久化/系统/动效）、`components/theme-reveal.css`（快照与圆盘层级）。
- 可选长文适配：`adapters/flow-wave.js`，在空闲期准备局部坐标，精确处理缓存失效。
- AI入口与接口：`AGENTS.md`、`AI-INTEGRATION.md`、`docs/API.md`。
- 性能总结与验收：`docs/PERFORMANCE.md`、`docs/VALIDATION.md`；历史数字不作为本新包通用跑分。
- 实际接入示例及独立浏览器测试：`examples/`、`tests/browser_smoke.py`、`tests/version_smoke.py`，以及HTML内联脚本解析检查。

## 当前验证结果

环境：Node 24.19.0、Python 3.13、Playwright 1.64.0、独立 headless Chromium 151.0.7922.34。合成页面，390×844触摸 / 1440×844鼠标，DPR1，无CPU降速；不是目标手机性能跑分。

- `npm run check` 通过；运行时为静态 ES module，无需打包，不将语法检查写成客户站点构建验收。
- 最终组件版本的 `tests/browser_smoke.py` 两种尺寸均通过，页面脚本错误为0。覆盖持久化、系统跟随/手动锁定、键盘、重连、静默value、disabled、减少动态效果、快速反切及原transition值/priority恢复。
- 长文覆盖抽屉开关/内部滚动不重建、pre横滚不重建、table横滚仍刷新、固定图真实load不重建、未知图真实load仍刷新、深滚动宽高/位置保持、打印和销毁清理。
- 本次发布阶段重跑共享组件回归，两种尺寸均通过；五版本定向测试也均通过，逐个按钮同步、旧组件真实视觉状态、新版iframe状态、键盘、减少动态效果、快速反切、来源校验、独立v5持久化和系统跟随均正常，脚本错误/关键资源失败为0。
- 五版本对比及v5独立页的手机/桌面亮暗共8张当前截图已检查；修正嵌入页暗色时浏览器补黑底的问题，嵌入画布色系与父页保持一致，按钮之外透明。
- 当前6张页面截图已逐张查看、核对尺寸：普通页亮暗各两张、长页暗色抽屉各一张。发现的手机抽屉压顶栏和桌面大纲链接挤在一行均已修正；最后仅改大纲链接排版后，另做390/1440定向补验：隐藏目标0、桌面可见目标18，抽屉开关计数不变且不遮顶栏。
- 390轻量路径另取样约1150ms：圆盘opacity为1，body底色为目标 `rgb(13,17,23)`；动画收束后覆盖层为0、几何保持。末段/结束截图已查看；这不是所有物理帧无闪烁的证明。
- 原v4与新按钮初始亮色、暗色及切回亮色已取图并人工对照。修正抽取时额外引入的层叠/定位差异；保留视觉结构与比例，不声称随机微动或全动画逐帧像素相同。
- `git diff --check` 通过；`v1.0/`～`v4.0/`、LICENSE无差异。公开新增文件定向扫描未发现私人绝对路径或凭据，文档/演示的本地资源链接复核通过。

本地证据在被忽略的 `test-results/`：`browser-smoke.json`、页面截图及按钮对照截图，不上传公开库。初次默认浏览器路径缺失，改由外部 `CHROME_PATH` 指定已安装的独立Chromium后通过；一次临时末段取样脚本误等待动画Promise，修正取样方式后通过，未据此更改产品逻辑。

## 发布通道与边界

用户已明确授权v5.0、README和五版本对比页上传，替代上一阶段仅本地审阅的临时限制。交付分支为原仓库 `master`，正常快进推送，不强制覆盖历史。GitHub Pages沿用仓库既有发布流程。

发布范围、排除项及复核流程见 [发布说明](docs/UPLOAD-PLAN.md)。仓库入口 → `AGENTS.md` / `AI-INTEGRATION.md` 为后续AI阅读路径；线上入口为根五版本对比、`v5.0/` 和 `examples/long-page.html`。发布时核对远端提交与本地一致，并检查线上页面版本及模块资源；不以git上传成功代替Pages部署完成。

未完成的边界：不同框架/布局的真实宿主、Safari/Firefox及目标手机真机仍需接入方验收；本轮未重跑历史shydoc全量性能或生产回归。
