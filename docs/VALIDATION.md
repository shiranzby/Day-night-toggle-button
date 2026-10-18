# 验收与复核

## 本仓库怎么运行

运行时无依赖、无打包要求。`npm run check` 只运行 Node 语法检查，不代表浏览器功能已通过。

浏览器测试使用 Python + Playwright，打开独立 headless Chromium，不连接日用浏览器。若当前环境尚未安装，请在自行管理的隔离 Python 环境中安装 Playwright 与对应 Chromium；不要为了测试改客户生产依赖。

```sh
npm run check
python tests/browser_smoke.py
python tests/version_smoke.py
python tests/coordinate_smoke.py
```

测试使用临时本地端口，结束关闭服务和浏览器。可通过 `CHROME_PATH` 指向自己的独立 Chromium；不在仓库硬编码某位开发者的路径。`test-results/` 为本地证据，不提交公开仓库。

覆盖普通页390手机/1440桌面、状态持久化/系统跟随、键盘、disabled、重连、程序value静默、减少动态效果、快速反切；长页覆盖隐藏右大纲、常驻抽屉、pre横滚不重建、table横滚更新、固定图片load不重建、未知图load更新、深滚动、宽高、打印和销毁清理。使用真实scroll/load并检查状态变化，不只是手工派发同名事件。

`version_smoke.py` 另验五版本逐个点击同步、iframe来源校验、嵌入键盘/减少动态效果、快速反切、v5独立页持久化/系统跟随、模块资源与手机宽度。对比页的五个按钮不混用两套同名注册；独立v5才运行新版页面控制器。

`coordinate_smoke.py` 用真实鼠标/触摸分别点击按钮两端，检查首击与快速第二击的圆盘中心、本次 `event.point` 和原 `detail` 字符串；同时检查Enter/Space/程序 `.click()` 不复用旧点、销毁后解绑，以及iframe桥传递本次局部坐标。`--label before` / `--label after` 可保存修复前后报告，旧实现应被这些断言拒绝。

发布后可用 `python tests/coordinate_smoke.py --base https://shiranzby.github.io/Day-night-toggle-button/ --label online` 验证实际线上资源，不启动本地服务。报告与截图仍只写入 ignored `test-results/`，线上与本地报告分开保留。

本仓库不含shydoc的付费课程原文、图床或部署密钥。合成示例通过，不等于原站全量回归；历史站点证据单独记录在PERFORMANCE.md。

## 接入宿主后的最小矩阵

| 场景 | 判据 |
| --- | --- |
| 首屏/刷新 | 在主题CSS前定初值；用户偏好优先，无手动偏好才系统跟随 |
| 手动/系统/跨标签页 | 按钮、主题属性、偏好一致；系统事件不写手动偏好，不复用旧点击坐标 |
| 亮暗双向与快速反切 | 最后一次请求生效；旧回调不删新动画，终态无圆盘/伪元素残留，原transition含空字符串正确恢复 |
| 减少动态效果 | 不创建页面动画，状态与功能仍正常 |
| 键盘 | Enter/Space仅触发一次，aria状态正确，焦点可见；非reduce时仍可正常动画，使用默认起点而非旧指针坐标 |
| 手机长页 | 不能只拿桌面样本代替；VT快照长任务要事先避开，watchdog不是抢占机制 |
| 抽屉与页签 | 内容已加载/布局，开关无网络与正文缓存更新；隐藏页签不可交互，独立滚动保位置 |
| 滚动/表格/图片 | 真正位置变化会刷新；无几何变化不刷新；异步字体/内容由宿主定向通知 |
| 几何/锚点 | 同时比较根clientWidth、scrollWidth、innerWidth、visualViewport.scale；全文高度/scrollY保持，远处锚点与打印正确 |
| 动画末段 | 圆盘opacity保持1，目标背景已落定再移除；不能只检查结束后的computed color |
| 卸载/重新挂载 | 释放listener、idle、timer、IO及动画；重连不重复attachShadow，不留全章观察器 |

截图分别检查亮色、暗色、动画中段、末段、抽屉交叠、深滚动；与实际代码版本对应。Shadow DOM内部动画与页面时钟可能不同步，无法证明逐帧完全一致时须如实说明，而不是扩大像素容差让报告变绿。

## 性能结论的边界

- trace用于归因，未插桩计时才用于同条件前后对照；记录浏览器、视口、DPR、触摸/CPU、资源状态、样本数。
- 点击到主题属性、VT ready、双rAF绘制机会、最长帧、INP是不同指标；不要改名字混用。
- 计数减少证明对应工作被删，不直接证明固定毫秒收益、p95或真机零卡顿。
- 完成一轮定向+阶段整合后停止；真实用户复现优先，不能用旧报告压过新问题。
