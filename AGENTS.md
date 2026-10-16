# 给后续 AI 的工作入口

1. 先读 `README.md`、`AI-INTEGRATION.md`、`docs/API.md`、`docs/PERFORMANCE.md`、`PROGRESS.md`。它们分别回答拿什么、怎么接、接口是什么、为什么这样做、验证到哪。
2. `v1.0/`～`v4.0/` 是历史独立展示；`v5.0/` 是新版演示，引用共享 `components/` 与 `adapters/flow-wave.js`。根 `index.html` 为五版本对比，通过iframe隔离新版与旧版同名 `<theme-button>`；同一document不要加载两套组件。
3. 先确定宿主现有主题状态源。有主题 store 的应用只接按钮事件，或明确改为本控制器；不要让系统监听、localStorage、框架 store 和按钮各自改主题。
4. 控件外观、主题状态、页面动效、正文结构是四件事。不要把客户正文、站点选择器、账号配置或图片上传写进公共组件。
5. 长文点击路径禁止全章 `querySelectorAll` / `getBoundingClientRect`；抽屉开关不重建正文缓存。不要以纯色遮挡正文冒充“正文随圆形揭示”。
6. 普通流适配器依赖直接子块纵向顺序。SPA、虚拟列表、多列等按各自生命周期适配，动态增删子块调用 `refresh()`，普通几何改变调用 `invalidate()`，离开页面调用控制器 `destroy()`。
7. 修改后先定向验证，再阶段性运行 `npm run check`、`python tests/browser_smoke.py` 与相关 `python tests/version_smoke.py`；检查当前手机/桌面截图。不因源码语法通过声称浏览器行为或真机帧率已验证。
8. 保留原按钮视觉与客户原文；减少动态效果、键盘、状态持久化、快速反切、末帧和卸载清理不能漏测。不要顺手更换配色、布局或删除效果。
9. 更新项目级 `PROGRESS.md`、`PROJECT_MEMORY.md`、`SOUL.md`；不把本机测试路径、部署密钥、账户标识、原始trace放进公开仓库。未经要求不发布 npm、不更新客户生产站点。
