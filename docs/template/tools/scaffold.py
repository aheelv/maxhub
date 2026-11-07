# -*- coding: utf-8 -*-
"""通用课程站点模板 · 新课程脚手架

把「固定结构」原样复制，把「按课程可配置项」按给定配置实例化，生成一份
可直接开始填内容的新课程包；随后用 validate.py 校验、build_indexes.py 构建。

用法：
  python course-template/tools/scaffold.py --config <新课程的 config.json> --out <目标目录>

生成内容：
  <out>/config/          新课程配置（复制自 --config）
  <out>/schema/          固定：配置 / 内容实例 / 映射契约 schema
  <out>/model/           固定：内容类型字典 / 关联词表 / 站点地图 / 对接字段映射
  <out>/tools/           固定：validate.py / build_indexes.py / scaffold.py
  <out>/data/            按课程可配置：空的 modules/sessions/knowledge-points/... 与最小 manifest
  <out>/README.md        套用步骤与待办清单
  <out>/_restricted/     入站受控区（.gitignore 与发布排除标记）
"""
from __future__ import annotations

import argparse
import io
import json
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def jwrite(p, o):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8').write(json.dumps(o, ensure_ascii=False, indent=2) + '\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', required=True, help='新课程配置文件路径')
    ap.add_argument('--out', required=True, help='输出目录（不得为模板包自身）')
    ap.add_argument('--force', action='store_true', help='目标目录已存在时覆盖其中生成的文件')
    a = ap.parse_args()

    cfg_path = os.path.abspath(a.config)
    out = os.path.abspath(a.out)
    if os.path.normcase(out) == os.path.normcase(ROOT):
        print('错误：输出目录不能是模板包自身。')
        return 1
    if os.path.exists(out) and os.listdir(out) and not a.force:
        print('错误：目标目录非空：%s（如确认覆盖请加 --force）' % out)
        return 1
    cfg = json.load(io.open(cfg_path, encoding='utf-8'))

    # 固定结构：整体复制
    for d in ['schema', 'model', 'tools']:
        shutil.copytree(os.path.join(ROOT, d), os.path.join(out, d), dirs_exist_ok=True)
    shutil.copy2(os.path.join(ROOT, 'README.md'), os.path.join(out, 'README.md'))

    # 按课程可配置：配置 + 数据骨架
    os.makedirs(os.path.join(out, 'config'), exist_ok=True)
    cfg['$schema'] = '../schema/course.config.schema.json'
    jwrite(os.path.join(out, 'config', 'course.config.json'), cfg)

    mods = cfg['modules']
    sessions = cfg['sessions']
    jwrite(os.path.join(out, 'data', 'modules.json'), mods)
    jwrite(os.path.join(out, 'data', 'sessions.json'), [
        {'no': s['no'], 'id': 'S%02d' % s['no'], 'module_id': s['module_id'],
         'title': s['title'], 'hours': s['hours'], 'slides': 0, 'summary': None,
         'points': [], 'kp_ids': [], 'textbook': None, 'deck': None,
         'deck_file': None, 'lesson_plan': None, 'syllabus_unit': None,
         'calendar': None, 'exercise': None, 'practice_kit': None,
         'exercise_minutes': None, 'resource_zip': None,
         'prev': 'S%02d' % (s['no'] - 1) if s['no'] > 1 else None,
         'next': 'S%02d' % (s['no'] + 1) if s['no'] < cfg['session_count'] else None}
        for s in sessions])
    jwrite(os.path.join(out, 'data', 'knowledge-points.json'), [])
    jwrite(os.path.join(out, 'data', 'terms.json'), [])
    jwrite(os.path.join(out, 'data', 'cases.json'), [])
    jwrite(os.path.join(out, 'data', 'lesson-plans.json'), [])
    jwrite(os.path.join(out, 'data', 'calendar.json'), [
        {'no': i, 'week_no': i, 'date': None, 'weekday': None,
         'session_id': 'S%02d' % i, 'hours': s['hours'], 'status': '待补充',
         'date_rule': '第 %d 教学周；具体日期由教务校历注入' % i, 'source': None}
        for i, s in enumerate(sessions, 1)])

    roots = [{
        'id': 'COURSE-ROOT', 'type': 'course', 'title': cfg['title'],
        'course_id': cfg['course_id'], 'session_no': None, 'module_id': None,
        'kp_ids': [], 'status': 'draft', 'version': '0.1', 'updated_at': None,
        'owner': '课程组', 'source': None, 'source_url': None, 'captured_at': None,
        'evidence_level': None, 'visibility': 'public', 'files': [], 'tags': [],
        'url': '/', 'ext': {'hours': cfg['hours'], 'sessions': cfg['session_count'],
                            'credits': cfg.get('credits')}}]
    for m in mods:
        roots.append({'id': m['id'], 'type': 'module', 'title': m['name'],
                      'course_id': cfg['course_id'], 'session_no': None,
                      'module_id': m['id'], 'kp_ids': [], 'status': 'draft',
                      'version': '0.1', 'updated_at': None, 'owner': '课程组',
                      'source': None, 'source_url': None, 'captured_at': None,
                      'evidence_level': None, 'visibility': 'public', 'files': [],
                      'tags': [], 'url': '/knowledge/modules/#%s' % m['id'],
                      'ext': {'no': m['no'], 'session_range': m['session_range']}})
    for s in sessions:
        roots.append({'id': 'S%02d' % s['no'], 'type': 'session', 'title': s['title'],
                      'course_id': cfg['course_id'], 'session_no': s['no'],
                      'module_id': s['module_id'], 'kp_ids': [], 'status': 'draft',
                      'version': '0.1', 'updated_at': None, 'owner': '课程组',
                      'source': None, 'source_url': None, 'captured_at': None,
                      'evidence_level': None, 'visibility': 'public', 'files': [],
                      'tags': [], 'url': '/sessions/%02d/' % s['no'],
                      'ext': {'hours': s['hours'], 'slides': 0, 'summary': None,
                              'points': [], 'lecture_minutes': cfg['lecture_minutes'],
                              'practice_minutes': cfg['practice_minutes']}})
    jwrite(os.path.join(out, 'data', 'content-manifest.json'), {
        'course_id': cfg['course_id'], 'generated_at': None,
        'generator': 'course-template/tools/scaffold.py',
        'note': '脚手架初始清单，仅含课程 / 模块 / 课次三类实体；其余内容逐步填充。',
        'counts': {'course': 1, 'module': len(mods), 'session': len(sessions)},
        'items': roots})
    edges = [{'from': m['id'], 'pred': 'belongs_to', 'to': 'COURSE-ROOT', 'note': ''} for m in mods]
    edges += [{'from': 'S%02d' % s['no'], 'pred': 'belongs_to', 'to': s['module_id'], 'note': ''}
              for s in sessions]
    jwrite(os.path.join(out, 'data', 'graph.json'), {
        'course_id': cfg['course_id'], 'nodes': len(roots), 'edges': len(edges),
        'predicates': ['belongs_to'], 'items': edges})

    rz = os.path.join(out, '_restricted')
    os.makedirs(rz, exist_ok=True)
    io.open(os.path.join(rz, '.gitignore'), 'w', encoding='utf-8').write('*\n!.gitignore\n')
    io.open(os.path.join(rz, 'README.txt'), 'w', encoding='utf-8').write(
        '入站受控区：超星 / 教务导出的学生信息与学情数据只能放在此处。\n'
        '禁止进入静态发布产物；使用前须聚合、脱敏；公开页面不得出现任何学生数据。\n')

    io.open(os.path.join(out, '套用待办.md'), 'w', encoding='utf-8').write(
        '# %s · 套用待办\n\n' % cfg['title'] +
        '1. 核对 `config/course.config.json`：课程编码、学期、校历起始日、超星课程空间 URL 未取得来源的保持 null 并标注待补充。\n'
        '2. 按 `model/sitemap.json` 建立目录与页面；固定结构不要改，只改配置与内容。\n'
        '3. 按 `model/content-types.json` 逐个补齐教材章节、课件、教案、日历、习题、实践包、知识点、案例、术语、素材。\n'
        '4. 每个 A 类素材必须填写 `source`、`source_url`、`captured_at` 与使用场景；B 类标注虚构；C 类标注待补充。\n'
        '5. 运行 `python tools/validate.py` 直到零错误。\n'
        '6. 运行 `python tools/build_indexes.py` 生成导航、站点地图、检索索引与超星交换文件。\n'
        '7. 导入超星前，按 `model/chaoxing-field-mapping.json` 核对本校模板列名与接口文档；未核验项不得写死。\n'
        '8. 发布前确认 `_restricted/`、`site/data/db.json`、后端文件均未被打包。\n')
    print('已生成新课程包：', out)
    print('  固定结构：schema/ model/ tools/ README.md')
    print('  可配置　：config/ data/（%d 模块 / %d 课次 / %d 初始实体）'
          % (len(mods), len(sessions), len(roots)))
    print('  受控区　：_restricted/（发布排除）')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
