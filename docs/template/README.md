# 通用课程站点模板（Course Site Template）

以**单门课程**为核心、以**课次（session）**为唯一组织轴的课程站点模板。把教材、课件、教学大纲、教学日历、教案、习题、实践环节、案例、术语、知识点统一到一套信息架构与元数据模型里，并通过适配层与超星学习通互补对接。

本模板是**结构 + 契约 + 工具**，不是一套写死内容的页面。固定结构所有课程共用；随课程变化的内容全部集中在 `config/course.config.json`。

---

## 1. 固定结构（不随课程变化，禁止逐课修改）

| 路径 | 作用 |
| --- | --- |
| `schema/course.config.schema.json` | 按课程可配置项的定义与约束 |
| `schema/content-instance.schema.json` | 每个内容对象的公共元数据 |
| `schema/chaoxing-mapping.schema.json` | 对接字段映射契约的结构约束 |
| `model/content-types.json` | 17 种内容类型字典、ID/URL 规则、状态与素材分级词表 |
| `model/relation-vocabulary.json` | 14 种有向关联谓词及与超星关系的对应 |
| `model/sitemap.json` | 栏目层级、URL 约定、现状迁移映射（机器可读站点地图） |
| `model/chaoxing-field-mapping.json` | 8 类数据集的字段映射、权威源、冲突规则、职责矩阵 |
| `tools/validate.py` | 离线校验（零依赖） |
| `tools/build_indexes.py` | 生成导航、站点地图、检索索引、超星交换 CSV |
| `tools/scaffold.py` | 从配置生成新课程包 |

**固定规则**：课次为主轴；内容实例公共字段 20 项；A/B/C 素材分级；三级导航深度；面包屑「课程 › 模块 › 课次 › 内容类型」；课次聚合页六大内容标签；静态发布排除后端与学生数据；对接以「站点是内容权威源、超星是教学运行权威源」为前提。

## 2. 按课程可配置项（全部在 `config/course.config.json`）

课程标识与题目、开课单位与专业、学分学时、课次数与单次课分钟数、讲授/实践配比、学期与校历起始日（无来源则 `null`）、模块划分、课次标题、工具清单、主导航与页脚文案与顺序、主题色 token、功能开关、对接数据集开关与方向、受控区路径与留存策略、素材分级默认值与习题时长下限、内容原件路径、构建输出与 `base_url`、自由扩展键。

完整字段说明见 `../课程空间重构/04_通用课程站点模板配置说明.md`。

## 3. 目录与数据流

```
config/course.config.json        唯一配置入口
model/                          固定契约
data/                           内容实例（由原件抽取，不复制原件）
  ├─ modules.json / sessions.json / knowledge-points.json
  ├─ lesson-plans.json / calendar.json / terms.json / cases.json
  ├─ content-manifest.json       371 个内容实例（本课程）
  └─ graph.json                  605 条关联边（本课程）
tools/build_indexes.py  ──►  dist/
  ├─ nav.json  sitemap.json  sitemap.xml  search-index.json
  ├─ content/graph.json  content/content-manifest.json
  ├─ export/*.csv                出站：知识图谱 / 课程结构 / 题库 / 资源清单 / 日历
  └─ import/*.template.csv       入站：仅表头，不含学生数据
_restricted/                     入站受控区，发布排除
```

## 4. 快速开始

```bash
# ① 校验当前课程包
python tools/validate.py

# ② 生成索引与交换文件
python tools/build_indexes.py

# ③ 套用到另一门课：先复制示例配置并改内容
cp config/course.config.example.json /tmp/my-course.json
#   编辑 course_id / title / modules / sessions / navigation / integration …
python tools/scaffold.py --config /tmp/my-course.json --out /tmp/my-course-site

# ④ 在新课程包里继续校验与构建
cd /tmp/my-course-site && python tools/validate.py --config course.config.json
```

> `validate.py` 默认校验 `config/人工智能工具应用实践.config.json`；用 `--config` 指定其他配置文件。`--root` 可指向另一份课程包。

## 5. 不可协商的约束

1. **不编造**：任何无法从现有材料核验的字段（校历日期、教务课程编码、超星课程空间 URL、知识点认知维度、语义先修关系、接口字段名）一律 `null` 或「待补充」，并在校验器里受约束。
2. **不重复**：`features.site_accounts` 与 `features.site_gradebook` 必须为 `false`；账号、选课、成绩、学情、签到、讨论、通知由超星承担。
3. **不落地个人数据**：入站学生信息与个人级学情只进入 `_restricted/`，且必须聚合、脱敏；静态发布产物中不得出现任何学生数据。
4. **一份内容一个原件**：超星侧只引用或上传副本，副本不回写站点；避免双份维护。
5. **A 类素材必带来源**：`source` / `source_url` / `captured_at` 与使用场景缺一不可；B 类显式标注虚构教学数据；C 类只列应采内容。
6. **接口字段待核验**：`chaoxing_api_field` 在取得校方接口文档前必须为 `null`，校验器会强制检查。

## 6. 文件清单

| 文件 | 说明 |
| --- | --- |
| `config/人工智能工具应用实践.config.json` | 本课程实例化配置（真实数据） |
| `config/course.config.example.json` | 可直接复制的占位示例（8 次课，已通过校验） |
| `data/*` | 本课程真实内容实例，共 371 条 |
| `dist/*` | 构建产物示例，可随时重建 |

配套设计文档位于 `../课程空间重构/`。
