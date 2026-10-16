# v5.0 GitHub 发布范围与流程

2026-10-16，用户已授权将接入包定为v5.0、更新README和五版本对比页后上传。实际发布状态只在 [PROGRESS.md](../PROGRESS.md) 维护；不发布 npm，不修改客户shydoc站点或部署配置。

## 1. 上传到哪里

- 原仓库：`shiranzby/Day-night-toggle-button`，不另建重复仓库。
- 已确认原仓库默认分支为 `master`。本轮按明确上传要求，检查远端最新提交、定向与阶段回归通过后提交并正常快进推送该分支，让GitHub Pages使用新的对比页。
- 不强制推送、不重写远端历史；如远端新增提交或出现冲突，先检查处理，不覆盖他人改动。若分支保护阻止直接推送，改为功能分支与PR并如实报告。

## 2. 哪些文件会上传

| 范围 | 内容 |
| --- | --- |
| `components/` | 按钮外观、主题控制器、揭示样式 |
| `v5.0/`、根 `index.html` | v5独立演示及五版本对比；隔离新旧同名组件 |
| `adapters/` | 可选普通文档流长页适配器 |
| `examples/` | 普通页和合成长页；不包含客户正文 |
| `docs/` | 接口、根因与修复、验收、本文上传方案 |
| `tests/`、`package.json` | 独立浏览器检查与语法检查入口；无第三方运行依赖 |
| `README.md`、`AGENTS.md`、`AI-INTEGRATION.md` | 读者/AI入口及接入边界 |
| `PROGRESS.md`、`PROJECT_MEMORY.md`、`SOUL.md` | 当前验收状态及长期维护原则 |
| `.gitignore` | 排除测试产物、缓存和本机依赖 |

保留 `v1.0/`～`v4.0/` 独立文件原样。根对比页加入第五项，同源iframe仅用于隔离版本展示；新宿主的正常接入无需iframe。README致谢展示段按要求移除，LICENSE版权与许可条款保留。

## 3. 哪些不会上传

- `test-results/` 中的本机截图和测试报告、Python缓存、`node_modules/`。
- 客户课程原文、上传图片、部署资料、密钥、账户信息、私人绝对路径和原始性能 trace。
- shydoc 的生产源码及部署改动；此次只把可移植经验与独立组件放入开源仓库。

## 4. 执行顺序

1. 检查最终差异、远端是否新增提交，复核历史独立版本没有改动、公开内容没有私密资料。
2. 运行语法、五版本/独立v5定向浏览器验收及阶段回归，查看手机/桌面当前截图；只暂存上述已核对文件。
3. 提交v5.0并正常推送 `master`；记录实际提交、远端一致性、Pages发布状态和资源检查结果。
4. 交付仓库及线上演示链接。GitHub Release、标签、npm发布与客户shydoc部署不属于本轮自动动作。

建议提交标题：`feat: release v5.0 integration and five-version comparison`。

## 5. 后续 AI 怎么读

发布后给 AI 原仓库链接，并要求先读 `AGENTS.md`、`AI-INTEGRATION.md`、`docs/API.md`、`docs/PERFORMANCE.md` 和 `PROGRESS.md`。先确定宿主状态源与页面结构，再选按钮、控制器及可选适配器，不复制历史演示整页。
