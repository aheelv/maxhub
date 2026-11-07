# -*- coding: utf-8 -*-
"""通用课程站点模板 · 索引与对接导出构建器（零第三方依赖）

从 config + model/sitemap.json + data/content-manifest.json 生成：
    dist/nav.json                        全站导航（含课次子项）
    dist/sitemap.json / sitemap.xml      具体 URL 清单
    dist/search-index.json               站内检索索引（仅公开内容）
    dist/content/graph.json              关联图副本
    dist/content/content-manifest.json   内容清单副本
    dist/export/*.csv                    面向超星的出站交换文件（站点规范列名）
    dist/import/*.csv                    入站模板（表头 + 说明行，不含任何学生数据）
    dist/README.txt                      构建说明

所有出站文件只包含课程内容，不包含任何学生个人信息或成绩。
用法：python course-template/tools/build_indexes.py [--config <文件名>] [--out <输出目录>]
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROJECT = os.path.dirname(ROOT)


def jload(p):
    return json.load(io.open(p, encoding='utf-8'))


def jwrite(p, obj):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')


def csvwrite(p, header, rows, note=None):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow(['' if v is None else v for v in r])
    if note:
        io.open(p + '.readme.txt', 'w', encoding='utf-8').write(note)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', default='人工智能工具应用实践.config.json')
    ap.add_argument('--out', default=None)
    a = ap.parse_args()
    cfg_path = os.path.join(ROOT, 'config', a.config)
    if not os.path.exists(cfg_path):
        alt = os.path.join(ROOT, 'config', 'course.config.json')
        if os.path.exists(alt):
            cfg_path = alt
    cfg = jload(cfg_path)
    sm = jload(os.path.join(ROOT, 'model', 'sitemap.json'))
    mf = jload(os.path.join(ROOT, 'data', 'content-manifest.json'))
    graph = jload(os.path.join(ROOT, 'data', 'graph.json'))
    mapping = jload(os.path.join(ROOT, 'model', 'chaoxing-field-mapping.json'))
    out = a.out or os.path.join(ROOT, 'dist')
    os.makedirs(out, exist_ok=True)
    base = cfg['build']['base_url'].rstrip('/')

    # ---------------------------------------------------------- 导航
    nav = {'course': cfg['title'], 'course_id': cfg['course_id'],
           'primary': cfg['navigation']['primary'],
           'footer': cfg['navigation']['footer'],
           'breadcrumb': cfg['navigation']['show_breadcrumb'],
           'prev_next': cfg['navigation']['show_prev_next'],
           'sessions': [{'no': s['no'], 'label': '第 %d 次课' % s['no'],
                         'title': s['title'], 'href': '/sessions/%02d/' % s['no'],
                         'module_id': s['module_id']} for s in cfg['sessions']],
           'session_tabs': [
               {'label': '教材', 'type': 'textbook-chapter', 'href_tpl': '/textbook/{nn}/'},
               {'label': '课件', 'type': 'deck', 'href_tpl': '/courseware/{nn}/'},
               {'label': '教案', 'type': 'lesson-plan', 'href_tpl': '/sessions/{nn}/plan/', 'teacher_only': True},
               {'label': '习题', 'type': 'exercise', 'href_tpl': '/exercises/{nn}/'},
               {'label': '实践包', 'type': 'practice-kit', 'href_tpl': '/practice/{nn}/'},
               {'label': '知识点', 'type': 'knowledge-point', 'href_tpl': '/knowledge/points/'}]}
    jwrite(os.path.join(out, 'nav.json'), nav)

    # ---------------------------------------------------------- 具体 URL
    urls = []
    for c in sm['columns']:
        if c.get('status') == 'deprecate' or not c.get('path'):
            continue
        path = c['path']
        if '{nn}' in path:
            for s in cfg['sessions']:
                p = path.replace('{nn}', '%02d' % s['no'])
                urls.append({'path': p, 'label': c['label'] + '｜第 %d 次课' % s['no'],
                             'column': c['id'], 'level': c['level'], 'status': c['status'],
                             'types': c['content_types']})
        elif '{kp}' in path:
            for it in mf['items']:
                if it['type'] == 'knowledge-point':
                    urls.append({'path': path.replace('{kp}', it['id'].lower()),
                                 'label': it['title'], 'column': c['id'],
                                 'level': c['level'], 'status': c['status'],
                                 'types': c['content_types']})
        elif '{id}' in path and c['id'] == 'case-detail':
            for it in mf['items']:
                if it['type'] == 'case':
                    urls.append({'path': path.replace('{id}', it['id'].lower()),
                                 'label': it['title'], 'column': c['id'],
                                 'level': c['level'], 'status': c['status'],
                                 'types': c['content_types']})
        else:
            urls.append({'path': path, 'label': c['label'], 'column': c['id'],
                         'level': c['level'], 'status': c['status'],
                         'types': c['content_types']})
    jwrite(os.path.join(out, 'sitemap.json'), {
        'base_url': base, 'generated_by': 'course-template/tools/build_indexes.py',
        'total': len(urls), 'urls': urls})

    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        if '|' in u['path'] or '{' in u['path']:
            continue
        xml.append('  <url><loc>%s%s</loc></url>' % (base, u['path']))
    xml.append('</urlset>')
    io.open(os.path.join(out, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(xml) + '\n')

    # ---------------------------------------------------------- 检索索引
    idx = []
    for it in mf['items']:
        if it['visibility'] != 'public' or it['status'] == '待补充':
            continue
        idx.append({'id': it['id'], 'type': it['type'], 'title': it['title'],
                    'url': it.get('url'), 'module_id': it.get('module_id'),
                    'session_no': it.get('session_no'), 'tags': it.get('tags', []),
                    'kp_ids': it.get('kp_ids', [])})
    jwrite(os.path.join(out, 'search-index.json'), {'total': len(idx), 'items': idx})

    # ---------------------------------------------------------- 内容数据副本
    os.makedirs(os.path.join(out, 'content'), exist_ok=True)
    jwrite(os.path.join(out, 'content', 'graph.json'), graph)
    jwrite(os.path.join(out, 'content', 'content-manifest.json'), mf)

    # ---------------------------------------------------------- 出站交换文件
    items = mf['items']
    by_type = lambda t: [x for x in items if x['type'] == t]
    note_common = ('本文件由 course-template/tools/build_indexes.py 自动生成，采用站点规范列名。\n'
                   '导入超星前须按 model/chaoxing-field-mapping.json 做列名适配；\n'
                   '超星模板实际列名与开放接口字段名标记为「待核验」，须以本校泛雅后台导出模板为准。\n'
                   '文件仅含课程内容，不含任何学生个人信息。\n')

    # 知识图谱
    kp = by_type('knowledge-point')
    csvwrite(os.path.join(out, 'export', 'knowledge-graph.csv'),
             ['kp_id', 'kp_name', 'parent_id', 'level', 'module_id', 'session_no',
              'tag', 'teaching_objective', 'cognitive_dimension', 'kp_category',
              'prerequisite_of', 'follows', 'related_to', 'review_status'],
             [[x['id'], x['title'], x['ext'].get('parent_id'), x['ext'].get('level'),
               x.get('module_id'), x.get('session_no'), '', '', '', '',
               '', '', '', x['ext'].get('review_status')] for x in kp],
             note_common + '\n前置/后置/关联列刻意留空：语义先修关系须教师核定，不得由课次顺序冒充。\n')

    # 课程结构
    csvwrite(os.path.join(out, 'export', 'course-structure.csv'),
             ['course_id', 'course_title', 'course_code', 'hours', 'credits',
              'module_id', 'module_name', 'session_no', 'session_title', 'session_hours'],
             [[cfg['course_id'], cfg['title'], cfg.get('course_code') or '', cfg['hours'],
               cfg.get('credits') or '', s['module_id'],
               next((m['name'] for m in cfg['modules'] if m['id'] == s['module_id']), ''),
               s['no'], s['title'], s['hours']] for s in cfg['sessions']],
             note_common + '\ncourse_code 为空：本校教务编码尚未提供，不编造。\n')

    # 题库题目（不含标准答案）
    ex = by_type('exercise')
    csvwrite(os.path.join(out, 'export', 'item-bank.csv'),
             ['item_id', 'session_no', 'title', 'question', 'kp_ids', 'duration_minutes',
              'independent', 'rubric_total', 'attachment_url', 'teacher_key_visible'],
             [[x['id'], x.get('session_no'), x['title'], x['ext'].get('question'),
               ';'.join(x.get('kp_ids', [])), x['ext'].get('duration_minutes'),
               x['ext'].get('independent'), x['ext'].get('rubric_total'),
               x.get('url'), 'false'] for x in ex],
             note_common + '\n教师核验卡（标准答案）默认不导出到学生可见题库。\n')

    # 资源清单
    res = [x for x in items if x['type'] in
           ('textbook-chapter', 'deck', 'deck-file', 'practice-kit', 'case', 'asset', 'reading')]
    csvwrite(os.path.join(out, 'export', 'resource-index.csv'),
             ['content_id', 'type', 'title', 'url', 'session_no', 'module_id',
              'kp_ids', 'evidence_level', 'source', 'source_url', 'captured_at'],
             [[x['id'], x['type'], x['title'], x.get('url'), x.get('session_no'),
               x.get('module_id'), ';'.join(x.get('kp_ids', [])), x.get('evidence_level'),
               x.get('source'), x.get('source_url'), x.get('captured_at')] for x in res],
             note_common)

    # 教学日历（日期留空）
    cal = by_type('calendar-entry')
    csvwrite(os.path.join(out, 'export', 'calendar.csv'),
             ['week_no', 'date', 'weekday', 'session_no', 'hours', 'deliverable', 'status', 'date_rule'],
             [[x['ext'].get('week_no'), '', '', x.get('session_no'), x['ext'].get('hours'),
               x['ext'].get('deliverable'), x['status'], x['ext'].get('date_rule')] for x in cal],
             note_common + '\ndate 列全部为空：教务校历未提供，禁止编造。\n')

    # ---------------------------------------------------------- 入站模板
    la = next(d for d in mapping['datasets'] if d['id'] == 'learning-analytics')
    hdr = [f['canonical'] for f in la['fields'] if f['direction'] in ('in', 'internal')]
    csvwrite(os.path.join(out, 'import', 'learning-analytics.template.csv'), hdr, [],
             '入站模板：仅表头，不含任何学生数据。\n'
             '实际列名须以本校超星后台导出表头为准（标记为待核验）。\n'
             '导入后必须聚合、脱敏，且只写入 _restricted/ 受控区，禁止进入静态发布产物。\n')
    sr = next(d for d in mapping['datasets'] if d['id'] == 'student-roster')
    hdr2 = [f['canonical'] for f in sr['fields']]
    csvwrite(os.path.join(out, 'import', 'student-roster.template.csv'), hdr2, [],
             '入站模板：仅表头，不含任何学生数据。\n'
             '姓名字段仅用于受控区临时关联后立即丢弃；公开站点永不出现姓名。\n')

    io.open(os.path.join(out, 'README.txt'), 'w', encoding='utf-8').write(
        '通用课程站点模板 · 构建产物\n'
        '课程：%s (%s)\n'
        'URL 条目：%d；公开检索条目：%d；内容实例：%d；关联边：%d\n'
        '出站 CSV：5 份（知识图谱 / 课程结构 / 题库 / 资源清单 / 教学日历）\n'
        '入站 CSV：2 份（仅表头模板，不含学生数据）\n'
        '说明：本目录为生成物，可随时由 build_indexes.py 重建；请勿手工编辑。\n'
        % (cfg['title'], cfg['course_id'], len(urls), len(idx), len(items), graph['edges']))

    print('构建完成 →', out)
    print('  URL 条目 %d / 检索条目 %d / 出站 CSV 5 / 入站模板 2' % (len(urls), len(idx)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
