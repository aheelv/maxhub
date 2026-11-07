# -*- coding: utf-8 -*-
"""通用课程站点模板 · 离线校验器（零第三方依赖）

用法：
    python course-template/tools/validate.py [--root <模板包根>] [--config <配置文件>]

校验范围：
    1. 配置文件贴合 course.config.schema.json（内置 JSON Schema 子集解释器）
    2. 课次主轴一致性（数量、连续性、模块归属、模块区间覆盖）
    3. 对接开关与映射契约一致；未取得接口文档时禁止出现 api 字段名
    4. content-manifest.json 的字段、类型、状态词表、A 类素材来源、文件存在性、KP 引用
    5. graph.json 的谓词词表、边的端点存在性、重复边；
       仅允许显式标注 ext_ref=true + status=待补充 的 TERM: 外部引用
    6. 映射契约结构（chaoxing-mapping.schema.json）

退出码 0 表示全部通过。
"""
from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ERRS = []
WARNS = []
CHECKS = [0]


def load(rel):
    with io.open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return json.load(f)


def err(msg):
    ERRS.append(msg)


def warn(msg):
    WARNS.append(msg)


def chk(cond, msg):
    CHECKS[0] += 1
    if not cond:
        err(msg)
    return cond


# ----------------------------------------------------------- JSON Schema 子集
TYPES = {
    'object': dict, 'array': list, 'string': str,
    'integer': int, 'number': (int, float), 'boolean': bool, 'null': type(None),
}


def _type_ok(v, t):
    if t == 'integer':
        return isinstance(v, int) and not isinstance(v, bool)
    if t == 'number':
        return isinstance(v, (int, float)) and not isinstance(v, bool)
    if t == 'boolean':
        return isinstance(v, bool)
    py = TYPES.get(t)
    return py is not None and isinstance(v, py) and not (py is int and isinstance(v, bool))


def validate(node, schema, path='$', root=None):
    """支持 type / required / properties / additionalProperties / patternProperties /
    items / enum / const / pattern / minLength / minItems / maxItems / minimum /
    maximum / format(date) / allOf / if-then / additionalProperties 作为 schema 对象。"""
    if root is None:
        root = node
    if not isinstance(schema, dict):
        return
    if 'if' in schema and 'then' in schema:
        try:
            sub = []
            _v(node, schema['if'], path, root, sub)
            matched = not sub
        except Exception:
            matched = False
        if matched:
            validate(node, schema['then'], path, root)
    if 'allOf' in schema:
        for s in schema['allOf']:
            validate(node, s, path, root)
    if 'type' in schema:
        ts = schema['type'] if isinstance(schema['type'], list) else [schema['type']]
        if not any(_type_ok(node, t) for t in ts):
            err('%s 类型应为 %s，实际 %s' % (path, '/'.join(ts), type(node).__name__))
            return
    if 'enum' in schema and node not in schema['enum']:
        err('%s 取值 %r 不在枚举 %r' % (path, node, schema['enum']))
    if 'const' in schema and node != schema['const']:
        err('%s 应为常量 %r' % (path, schema['const']))
    if isinstance(node, str):
        if 'pattern' in schema and not re.search(schema['pattern'], node):
            err('%s 不匹配 %s（值 %r）' % (path, schema['pattern'], node))
        if 'minLength' in schema and len(node) < schema['minLength']:
            err('%s 长度不足 %d' % (path, schema['minLength']))
        if schema.get('format') == 'date' and node is not None and node != '' \
                and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', node):
            err('%s 应为 YYYY-MM-DD 日期' % path)
    if isinstance(node, (int, float)) and not isinstance(node, bool):
        if 'minimum' in schema and node < schema['minimum']:
            err('%s 小于最小值 %s' % (path, schema['minimum']))
        if 'maximum' in schema and node > schema['maximum']:
            err('%s 大于最大值 %s' % (path, schema['maximum']))
    if isinstance(node, list):
        if 'minItems' in schema and len(node) < schema['minItems']:
            err('%s 条目不足 %d' % (path, schema['minItems']))
        if 'maxItems' in schema and len(node) > schema['maxItems']:
            err('%s 条目超过 %d' % (path, schema['maxItems']))
        if isinstance(schema.get('items'), dict):
            for i, x in enumerate(node):
                validate(x, schema['items'], '%s[%d]' % (path, i), root)
    if isinstance(node, dict):
        for k in schema.get('required', []):
            if k not in node:
                err('%s 缺少必填字段 %s' % (path, k))
        props = schema.get('properties', {})
        pats = schema.get('patternProperties', {})
        for k, v in node.items():
            if k.startswith('$'):
                continue
            if k in props:
                validate(v, props[k], '%s.%s' % (path, k), root)
            else:
                hit = None
                for p, s in pats.items():
                    if re.search(p, k):
                        hit = s
                        break
                if hit is not None:
                    validate(v, hit, '%s.%s' % (path, k), root)
                elif schema.get('additionalProperties') is False:
                    err('%s 出现未声明字段 %s' % (path, k))
                elif isinstance(schema.get('additionalProperties'), dict):
                    validate(v, schema['additionalProperties'], '%s.%s' % (path, k), root)


def _v(node, schema, path, root, out):
    """用于 if 条件探测：把错误收集到 out 而非全局。"""
    global ERRS
    old = ERRS
    ERRS = out
    try:
        validate(node, schema, path, root)
    finally:
        ERRS = old


# ----------------------------------------------------------- 业务校验
def check_config(cfg):
    validate(cfg, load('schema/course.config.schema.json'), 'config')

    n = cfg.get('session_count')
    ss = cfg.get('sessions', [])
    chk(len(ss) == n, 'config: sessions 数量 %d ≠ session_count %d' % (len(ss), n))
    nums = sorted(x['no'] for x in ss)
    chk(nums == list(range(1, n + 1)), 'config: 课次编号不连续或不唯一：%r' % nums[:20])
    mods = {m['id'] for m in cfg.get('modules', [])}
    for s in ss:
        chk(s['module_id'] in mods, 'config: 课次 %s 引用了不存在的模块 %s' % (s['no'], s['module_id']))
    covered = set()
    for m in cfg.get('modules', []):
        a, b = m['session_range']
        chk(a <= b, 'config: 模块 %s 区间倒置' % m['id'])
        covered |= set(range(a, b + 1))
    chk(covered == set(range(1, n + 1)), 'config: 模块区间未完整覆盖 1..%d，缺 %r'
        % (n, sorted(set(range(1, n + 1)) - covered)))
    lm, pm = cfg.get('lecture_minutes', 0), cfg.get('practice_minutes', 0)
    chk(lm + pm == cfg.get('session_minutes'), 'config: 讲授 %d + 实践 %d ≠ 单次课 %d 分钟'
        % (lm, pm, cfg.get('session_minutes', 0)))
    f = cfg.get('features', {})
    chk(f.get('site_accounts') is False, 'config: site_accounts 必须为 false（账号由超星承担）')
    chk(f.get('site_gradebook') is False, 'config: site_gradebook 必须为 false（成绩由超星承担）')
    chk(len(cfg['navigation']['primary']) <= 7, 'config: 主导航超过 7 项')
    return cfg


def check_mapping(cfg):
    mp = load('model/chaoxing-field-mapping.json')
    validate(mp, load('schema/chaoxing-mapping.schema.json'), 'mapping')
    ids = {d['id'] for d in mp['datasets']}
    ds = cfg['integration']['datasets']
    unknown = set(ds) - ids
    chk(not unknown, 'config: 对接开关引用了未定义的数据集 %r' % sorted(unknown))
    api_ready = cfg['integration']['chaoxing']['api_contract_status'] == '已获取校方接口文档'
    for d in mp['datasets']:
        for f in d['fields']:
            chk('已核验' in f['verification'] or '待核验' in f['verification'] or '不适用' in f['verification'],
                'mapping: %s.%s 未标注核验状态' % (d['id'], f['canonical']))
            if not api_ready:
                chk(f['chaoxing_api_field'] is None,
                    'mapping: 尚未取得校方接口文档，%s.%s 不应写死接口字段名'
                    % (d['id'], f['canonical']))
    for row in mp['responsibility_matrix']:
        if row['duplicate_risk'] == '高':
            chk('不' in row['site'] or '仅' in row['site'] or '改为跳转' in row['rule'],
                'mapping: 高重复风险能力「%s」的站点侧职责未收敛' % row['capability'])
    return mp


def check_manifest():
    mf = load('data/content-manifest.json')
    types = {t['code']: t for t in load('model/content-types.json')['types']}
    schema = load('schema/content-instance.schema.json')
    ids, urls, kpids = set(), {}, set()
    sess = load('data/sessions.json')
    valid_sessions = {s['no'] for s in sess}
    project_root = os.path.dirname(ROOT)   # course-template/ 的上一级即课程项目根
    for it in mf['items']:
        p = 'manifest[%s]' % it.get('id')
        validate(it, schema, p)
        chk(it['type'] in types, '%s 类型 %s 不在内容类型字典' % (p, it['type']))
        if it['id'] in ids:
            err('%s 重复 ID' % p)
        ids.add(it['id'])
        if it['type'] == 'knowledge-point':
            kpids.add(it['id'])
        if it.get('url'):
            if it['url'] in urls:
                warn('%s URL %s 与 %s 重复' % (p, it['url'], urls[it['url']]))
            urls[it['url']] = it['id']
        if it.get('session_no') is not None:
            chk(it['session_no'] in valid_sessions, '%s 课次号 %s 无效' % (p, it['session_no']))
        if it.get('evidence_level') == 'A':
            chk(bool(it.get('source')), '%s A 类素材缺 source' % p)
            if it.get('source_url', '') and str(it['source_url']).startswith('http'):
                chk(bool(it.get('captured_at')), '%s 外部 A 类素材缺抓取日期 captured_at' % p)
        for f in it.get('files', []):
            fp = f.get('path')
            if fp and not fp.startswith('http'):
                chk(os.path.exists(os.path.join(project_root, fp)),
                    '%s 引用的文件不存在：%s' % (p, fp))
    for it in mf['items']:
        for k in it.get('kp_ids', []):
            chk(k in kpids, 'manifest[%s] 引用了不存在的知识点 %s' % (it['id'], k))
    return mf, ids


def check_graph(ids):
    g = load('data/graph.json')
    preds = {p['code'] for p in load('model/relation-vocabulary.json')['predicates']}
    seen = set()
    for e in g['items']:
        chk(e['pred'] in preds, 'graph: 未定义谓词 %s' % e['pred'])
        chk(e['from'] in ids, 'graph: 边起点不存在 %s' % e['from'])
        to = e['to']
        if to in ids:
            pass
        elif (to.startswith('TERM:') and e.get('ext_ref') is True
              and '待补充' in e.get('note', '')):
            pass  # 显式标注的外部引用：词典中尚未定义的术语，不得伪装成内容实例
        else:
            err('graph: 边终点不存在，或外部引用未标注 ext_ref/待补充 %s' % to)
        if e.get('ext_ref') is True and e.get('status') != '待补充':
            err('graph: 外部引用必须标注 status=待补充 %s' % to)
        key = (e['from'], e['pred'], e['to'])
        if key in seen:
            warn('graph: 重复边 %r' % (key,))
        seen.add(key)
    return g


def main():
    global ROOT
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=ROOT)
    ap.add_argument('--config', default='人工智能工具应用实践.config.json')
    args = ap.parse_args()
    ROOT = os.path.abspath(args.root)
    cfg_path = os.path.join(ROOT, 'config', args.config)
    if not os.path.exists(cfg_path):
        alt = os.path.join(ROOT, 'config', 'course.config.json')
        if os.path.exists(alt):
            cfg_path = alt
    cfg = json.load(io.open(cfg_path, encoding='utf-8'))
    print('校验模板包：', ROOT)
    print('配置文件　：', os.path.basename(cfg_path))

    check_config(cfg)
    check_mapping(cfg)
    mf, ids = check_manifest()
    g = check_graph(ids)

    print('\n内容实例 %d 个 / 类型 %d 种 / 关联边 %d 条 / 校验断言 %d 次'
          % (len(mf['items']), len(mf['counts']), g['edges'], CHECKS[0]))
    if WARNS:
        print('提示 %d 条：' % len(WARNS))
        for w in WARNS[:12]:
            print('  · ' + w)
    if ERRS:
        print('错误 %d 条：' % len(ERRS))
        for e in ERRS[:40]:
            print('  × ' + e)
        if len(ERRS) > 40:
            print('  … 另有 %d 条' % (len(ERRS) - 40))
        return 1
    print('结论：全部通过。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
