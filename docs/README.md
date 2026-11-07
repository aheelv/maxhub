# aheelv/maxhub · 人工智能工具应用实践课程门户

大连财经学院管理学院《人工智能工具应用实践》课程网站，由 GitHub Pages 静态托管。

**唯一有效的发布目标：** 仓库 `aheelv/maxhub`，分支 `master`，发布根 `docs/`。
**当前站点地址：** https://aheelv.github.io/maxhub/

> 发布状态（2026-11-07）：原发布目标 `aheelv/aheelv.github.io`（站点
> https://aheelv.github.io/ ，提交 a727a2f）已停止对外服务，不再是有效发布目标：
> 该仓库已设为私有，GitHub 随之自动取消发布其 Pages 站点，原地址返回 HTTP 404。
> 仓库仅作为私有历史留存，其 468 个文件与全部提交历史保持不变。架构文档、教材与截图来源
> 清单中对该旧地址的引用，均为 2026-11-06 抓取时的历史证据记录，不代表发布目标。

本发布版从当前源码重新生成，并纳入本轮新增成果（《最热AI应用实践课》5 节完整实践课、
教材阅读版、课程空间重构待发布版本与信息架构蓝图、通用课程站点模板包），
不包含旧发布版本的任何缓存副本。

## 内容

| 路径 | 说明 |
| --- | --- |
| `index.html` | 课程首页（含 16 次课练习资源直达下载区） |
| `exercises.html` | 16 次课练习下载页：按模块筛选、搜索、整包或逐份下载 |
| `courseware.html` / `syllabus.html` / `modules.html` 等 | 课件中心、课程大纲、知识模块、案例、术语、趋势 |
| `downloads/` | 16 个单课 ZIP、全 16 课总包、总手册、资源清单与 188 份单课资料；《最热AI应用实践课》5 个单课素材包与 1 个全套资料包 |
| `hot/index.html` | 《最热AI应用实践课》主页：热度排序、5 节课程、素材下载、公开来源、WorkBuddy 能力基线 |
| `hot/lesson1.html`—`lesson5.html` | 5 节独立完整实践课全文：方向说明、素材清单、工具环境、逐步操作、一站式流程、成品形式与 100 分验收标准 |
| `hot/verify.html` / `hot/access.html` | 发布前逐项验证清单；各角色默认口令与登录下载说明 |
| `hot/materials/` | 5 课共 45 份课堂素材的逐份网页副本（含示例分镜图） |
| `practice/index.html` | 独立课堂练习资源站（16 课任务详情与逐份下载） |
| `architecture/待发布版本.html` | 本轮待发布版本阅读版（整合结构、内容清单、超星衔接标注、发布就绪度） |
| `architecture/信息架构蓝图.html` | 课程空间信息架构交互蓝图 |
| `textbook/` | 教材文本与修改详细说明的阅读版、16 份分章文本、24 张真实界面截图 |
| `template/` | 通用课程站点模板包（内容模型、schema、配置、索引与校验工具） |
| `PUBLISH.md` / `publish-manifest.json` | 本次发布的内容范围、目标位置、原发布对象与文件清单 |

练习题目均为单次课 70—100 分钟、学生单人独立完成、以 WorkBuddy 为主要工具的 AI 应用任务；每套含任务说明、背景资料、素材、分钟级操作步骤、成果要求、100 分评价量规与教师核验卡。素材全部为课堂虚构数据。

## 静态展示版的限制

GitHub Pages 不运行 Node.js 后端，因此以下功能在本站点不可用，页面会给出明确提示：

- 登录 / 注册 / 扫码登录、个人中心
- 选课意向、学习反馈的实时提交与统计
- 教师发布课程通知

这些页面仍可浏览，用于展示界面与课程内容。**全部练习资源与《最热AI应用实践课》素材包均为公开静态文件，无需登录即可直接下载**；
各角色默认口令仅用于本地完整交互版的登录演示，详见 `hot/access.html`。**完整交互版**请在本地运行：

```bash
cd site
node server.js
# 打开 http://localhost:3000
```

后端为纯 Node.js 内置模块实现，数据存于 `site/data/db.json`（未包含在静态发布版中）。

## 构建与维护

源文件位于课程项目仓库，`exercise-build/` 下提供可重复构建脚本：

```bash
python exercise-build/build.py          # 任务单、素材、16 个 ZIP、清单与元数据
python exercise-build/build_pages.py    # 两站网页与 site/downloads 同步
python exercise-build/verify_pages.py   # 链接、锚点、ZIP 完整性体检
python exercise-build/prepare_publish.py <输出目录>   # 生成静态发布版
```

发布版自动排除 `server.js`、`package.json` 与 `data/`，注入 `static-mode.js` 处理 `/api/*` 降级，并写入 `.nojekyll` 以保证中文文件名与 `.md` 资源按原样提供。
