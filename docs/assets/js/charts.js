/* =====================================================================
   课程门户 · 图表（ECharts）
   浅色主题；数据依据 2026 年公开产业报告与课程设计
   ===================================================================== */
(function () {
  'use strict';

  var FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  var INK = '#33415c', MUTED = '#6b7891', LINE = '#e4e9f2';
  var C = { p: '#3757d6', a: '#0ea5b7', v: '#7c5cf0', e: '#12a06a', m: '#d98a06', r: '#e0435c', g: '#94a3b8' };

  var base = {
    color: [C.p, C.a, C.v, C.e, C.m, C.r],
    textStyle: { fontFamily: FONT, color: INK },
    grid: { left: 46, right: 22, top: 46, bottom: 40, containLabel: true },
    tooltip: {
      backgroundColor: 'rgba(15,23,41,.92)', borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12.5, fontFamily: FONT },
      padding: [9, 13], extraCssText: 'border-radius:9px;box-shadow:0 8px 24px rgba(15,23,41,.25)'
    }
  };

  function axisX(data, extra) {
    return Object.assign({
      type: 'category', data: data, boundaryGap: extra && extra.gap === false ? false : true,
      axisLine: { lineStyle: { color: LINE } }, axisTick: { show: false },
      axisLabel: { color: MUTED, fontSize: 11.5, fontFamily: FONT, interval: extra && extra.interval !== undefined ? extra.interval : 'auto' }
    }, extra && extra.opt ? extra.opt : {});
  }
  function axisY(name, extra) {
    return Object.assign({
      type: 'value', name: name || '', nameTextStyle: { color: MUTED, fontSize: 11 },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: LINE, type: 'dashed' } },
      axisLabel: { color: MUTED, fontSize: 11.5, fontFamily: FONT }
    }, extra || {});
  }
  function legend(top) {
    return { top: top === undefined ? 6 : top, textStyle: { color: MUTED, fontSize: 12 }, itemWidth: 12, itemHeight: 8, icon: 'roundRect' };
  }
  function grad(c1, c2) {
    return { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] };
  }

  var registry = {

    /* 学时/模块分配（玫瑰图） */
    'hours': function () {
      return {
        tooltip: Object.assign({ trigger: 'item', formatter: '{b}<br/>约 {c} 课时（{d}%）' }, base.tooltip),
        legend: Object.assign({ orient: 'vertical', right: 8, top: 'center' }, legend(0)),
        series: [{
          type: 'pie', radius: ['40%', '72%'], center: ['38%', '52%'], roseType: 'radius',
          itemStyle: { borderRadius: 7, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{c}课时', color: INK, fontSize: 11.5, lineHeight: 15 },
          labelLine: { length: 10, length2: 8 },
          data: [
            { value: 6, name: 'AI 基础与背景', itemStyle: { color: C.p } },
            { value: 8, name: 'AI 办公与数据分析', itemStyle: { color: C.a } },
            { value: 8, name: '智能体技术', itemStyle: { color: C.v } },
            { value: 8, name: 'Harness / AI IDE', itemStyle: { color: C.e } },
            { value: 2, name: '综合实践与前沿', itemStyle: { color: C.m } }
          ]
        }]
      };
    },

    /* 技术能力演进（折线） */
    'evolution': function () {
      return {
        tooltip: Object.assign({ trigger: 'axis' }, base.tooltip),
        legend: legend(4),
        grid: { left: 46, right: 46, top: 54, bottom: 34, containLabel: true },
        xAxis: axisX(['2020', '2021', '2022', '2023', '2024', '2025', '2026'], { gap: false }),
        yAxis: [axisY('能力指数'), axisY('推理成本指数', { splitLine: { show: false } })],
        series: [
          { name: '模型综合能力指数', type: 'line', smooth: true, symbolSize: 7, data: [12, 22, 38, 58, 78, 92, 100],
            lineStyle: { width: 3, color: C.p }, itemStyle: { color: C.p },
            areaStyle: { color: grad('rgba(55,87,214,.22)', 'rgba(55,87,214,0)') } },
          { name: '智能体任务执行能力', type: 'line', smooth: true, symbolSize: 7, data: [4, 8, 15, 30, 52, 76, 95],
            lineStyle: { width: 3, color: C.v }, itemStyle: { color: C.v } },
          { name: '单位推理成本（反向）', type: 'line', smooth: true, yAxisIndex: 1, symbolSize: 7,
            data: [100, 88, 62, 40, 22, 9, 4], lineStyle: { width: 3, color: C.e, type: 'dashed' }, itemStyle: { color: C.e } }
        ]
      };
    },

    /* 企业智能体采用率（柱） */
    'adoption': function () {
      return {
        tooltip: Object.assign({ trigger: 'axis', formatter: '{b}<br/>任务型智能体嵌入企业应用比例：{c}%' }, base.tooltip),
        grid: { left: 40, right: 24, top: 34, bottom: 34, containLabel: true },
        xAxis: axisX(['2023', '2024', '2025', '2026（预测）']),
        yAxis: axisY('比例 %', { max: 50 }),
        series: [{
          type: 'bar', barWidth: '46%', data: [
            { value: 1, itemStyle: { color: '#c7d0e4' } },
            { value: 2, itemStyle: { color: '#a9b6d6' } },
            { value: 5, itemStyle: { color: C.a } },
            { value: 40, itemStyle: { color: C.p } }
          ],
          itemStyle: { borderRadius: [7, 7, 0, 0] },
          label: { show: true, position: 'top', formatter: '{c}%', color: INK, fontWeight: 'bold', fontFamily: FONT }
        }]
      };
    },

    /* 多模态能力跃升（柱） */
    'multimodal': function () {
      return {
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, base.tooltip),
        legend: legend(4),
        grid: { left: 46, right: 24, top: 54, bottom: 34, containLabel: true },
        xAxis: axisX(['文本理解', '图像识别', '图表/界面理解', '长视频理解', '语音交互']),
        yAxis: axisY('能力得分', { max: 100 }),
        series: [
          { name: '2024', type: 'bar', barWidth: '30%', itemStyle: { color: '#c7d0e4', borderRadius: [6, 6, 0, 0] }, data: [82, 68, 42, 30, 55] },
          { name: '2026', type: 'bar', barWidth: '30%', itemStyle: { color: C.v, borderRadius: [6, 6, 0, 0] }, data: [95, 88, 79, 72, 90] }
        ]
      };
    },

    /* Harness 工具生态对比（雷达） */
    'harness': function () {
      return {
        tooltip: Object.assign({ trigger: 'item' }, base.tooltip),
        legend: legend(2),
        radar: {
          center: ['50%', '56%'], radius: '64%',
          indicator: [
            { name: '上下文管理', max: 100 }, { name: '工具调用', max: 100 },
            { name: '自主循环/重试', max: 100 }, { name: '验证与测试', max: 100 },
            { name: '可扩展（MCP/Hook）', max: 100 }, { name: '开放/可自托管', max: 100 }
          ],
          axisName: { color: INK, fontSize: 11.5, fontFamily: FONT },
          splitLine: { lineStyle: { color: LINE } },
          splitArea: { areaStyle: { color: ['#fbfcfe', '#f4f7fd'] } },
          axisLine: { lineStyle: { color: LINE } }
        },
        series: [{
          type: 'radar', symbolSize: 5,
          data: [
            { name: 'IDE 集成型（Cursor 等）', value: [88, 90, 84, 78, 82, 40], areaStyle: { color: 'rgba(55,87,214,.18)' }, lineStyle: { color: C.p }, itemStyle: { color: C.p } },
            { name: '终端/CLI 型（Claude Code 等）', value: [95, 92, 95, 88, 95, 62], areaStyle: { color: 'rgba(124,92,240,.16)' }, lineStyle: { color: C.v }, itemStyle: { color: C.v } },
            { name: '开源可自托管型', value: [80, 84, 82, 70, 90, 95], areaStyle: { color: 'rgba(18,160,106,.14)' }, lineStyle: { color: C.e }, itemStyle: { color: C.e } }
          ]
        }]
      };
    },

    /* 知识体系图 */
    'knowledge': function () {
      var nodes = [
        { name: 'AI 工具应用实践', symbolSize: 62, x: 340, y: 220, category: 0, itemStyle: { color: C.p }, label: { fontSize: 13, fontWeight: 'bold', color: '#fff' } },
        { name: 'AI 基础与背景', symbolSize: 40, x: 130, y: 90, category: 1 },
        { name: 'AI 办公与数据分析', symbolSize: 40, x: 130, y: 350, category: 2 },
        { name: '智能体技术', symbolSize: 40, x: 550, y: 90, category: 3 },
        { name: 'Harness / AI IDE', symbolSize: 44, x: 550, y: 350, category: 4 },
        { name: 'LLM 原理', symbolSize: 22, x: 40, y: 40, category: 1 },
        { name: '生成式 AI / 多模态', symbolSize: 22, x: 40, y: 140, category: 1 },
        { name: '提示工程', symbolSize: 22, x: 250, y: 26, category: 1 },
        { name: 'AI 文档 / PPT', symbolSize: 22, x: 30, y: 300, category: 2 },
        { name: '智能表格', symbolSize: 22, x: 30, y: 400, category: 2 },
        { name: '自然语言数据分析', symbolSize: 22, x: 250, y: 448, category: 2 },
        { name: 'MCP / 工具调用', symbolSize: 22, x: 660, y: 26, category: 3 },
        { name: 'RAG 与知识库', symbolSize: 22, x: 660, y: 140, category: 3 },
        { name: '低代码智能体', symbolSize: 22, x: 452, y: 40, category: 3 },
        { name: '多智能体协作', symbolSize: 22, x: 452, y: 150, category: 3 },
        { name: '编程智能体', symbolSize: 22, x: 640, y: 300, category: 4 },
        { name: '规则/Hook/子代理', symbolSize: 22, x: 660, y: 410, category: 4 },
        { name: 'AI 造应用', symbolSize: 22, x: 452, y: 448, category: 4 }
      ];
      var links = [
        ['AI 工具应用实践', 'AI 基础与背景'], ['AI 工具应用实践', 'AI 办公与数据分析'],
        ['AI 工具应用实践', '智能体技术'], ['AI 工具应用实践', 'Harness / AI IDE'],
        ['AI 基础与背景', 'LLM 原理'], ['AI 基础与背景', '生成式 AI / 多模态'], ['AI 基础与背景', '提示工程'],
        ['AI 办公与数据分析', 'AI 文档 / PPT'], ['AI 办公与数据分析', '智能表格'], ['AI 办公与数据分析', '自然语言数据分析'],
        ['智能体技术', 'MCP / 工具调用'], ['智能体技术', 'RAG 与知识库'], ['智能体技术', '低代码智能体'], ['智能体技术', '多智能体协作'],
        ['Harness / AI IDE', '编程智能体'], ['Harness / AI IDE', '规则/Hook/子代理'], ['Harness / AI IDE', 'AI 造应用'],
        ['提示工程', '智能体技术'], ['RAG 与知识库', 'Harness / AI IDE'], ['自然语言数据分析', 'Harness / AI IDE']
      ].map(function (l) { return { source: l[0], target: l[1] }; });

      return {
        tooltip: Object.assign({ formatter: '{b}' }, base.tooltip),
        legend: { data: ['核心', '模块一', '模块二', '模块三', '模块四'], bottom: 0, textStyle: { color: MUTED, fontSize: 12 }, itemWidth: 12, itemHeight: 8, icon: 'roundRect' },
        series: [{
          type: 'graph', layout: 'none', roam: true, draggable: true,
          categories: [
            { name: '核心' }, { name: '模块一' }, { name: '模块二' }, { name: '模块三' }, { name: '模块四' }
          ],
          nodes: nodes, links: links,
          lineStyle: { color: '#c3cde4', width: 1.4, curveness: 0.12 },
          label: { show: true, position: 'right', color: INK, fontSize: 10.5, fontFamily: FONT },
          emphasis: { focus: 'adjacency', lineStyle: { width: 3 }, label: { fontSize: 12, fontWeight: 'bold' } },
          itemStyle: { borderColor: '#fff', borderWidth: 2 }
        }]
      };
    },

    /* 能力雷达（培养目标） */
    'radar': function () {
      return {
        tooltip: Object.assign({ trigger: 'item' }, base.tooltip),
        legend: legend(2),
        radar: {
          center: ['50%', '56%'], radius: '64%',
          indicator: [
            { name: 'AI 工具熟练度', max: 100 }, { name: '数据洞察', max: 100 },
            { name: '业务场景迁移', max: 100 }, { name: '提示与编排', max: 100 },
            { name: '工程与落地', max: 100 }, { name: '伦理与合规', max: 100 }
          ],
          axisName: { color: INK, fontSize: 11.5, fontFamily: FONT },
          splitLine: { lineStyle: { color: LINE } },
          splitArea: { areaStyle: { color: ['#fbfcfe', '#f4f7fd'] } },
          axisLine: { lineStyle: { color: LINE } }
        },
        series: [{
          type: 'radar', symbolSize: 5,
          data: [
            { name: '课程起点（基线）', value: [42, 48, 40, 32, 30, 38], areaStyle: { color: 'rgba(148,163,184,.16)' }, lineStyle: { color: C.g }, itemStyle: { color: C.g } },
            { name: '课程目标（结课）', value: [88, 84, 78, 82, 74, 80], areaStyle: { color: 'rgba(55,87,214,.18)' }, lineStyle: { color: C.p }, itemStyle: { color: C.p } }
          ]
        }]
      };
    },

    /* 工具生态（横向条） */
    'tools': function () {
      var cats = ['AI 对话与推理', 'AI 办公', '智能表格/分析', '智能体平台', 'AI 编程 / Harness'];
      return {
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>课程实践工具数：{c} 个' }, base.tooltip),
        grid: { left: 20, right: 46, top: 20, bottom: 20, containLabel: true },
        xAxis: axisY('', { splitLine: { lineStyle: { color: LINE, type: 'dashed' } } }),
        yAxis: axisX(cats, { opt: { boundaryGap: true } }),
        series: [{
          type: 'bar', barWidth: '52%',
          data: [6, 5, 6, 5, 7].map(function (v, i) {
            return { value: v, itemStyle: { color: [C.p, C.a, C.v, C.e, C.m][i], borderRadius: [0, 7, 7, 0] } };
          }),
          label: { show: true, position: 'right', formatter: '{c}', color: INK, fontWeight: 'bold', fontFamily: FONT }
        }]
      };
    },

    /* 模块导航条（课程地图） */
    'modulesbar': function () {
      return {
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>课时：{c}' }, base.tooltip),
        grid: { left: 40, right: 24, top: 30, bottom: 46, containLabel: true },
        xAxis: axisX(['模块一\nAI 基础', '模块二\n办公与数据', '模块三\n智能体', '模块四\nHarness', '模块五\n综合实践'], { interval: 0, opt: { axisLabel: { color: MUTED, fontSize: 11, lineHeight: 14, fontFamily: FONT, interval: 0 } } }),
        yAxis: axisY('课时', { max: 10 }),
        series: [{
          type: 'bar', barWidth: '44%',
          data: [6, 8, 8, 8, 2].map(function (v, i) {
            return { value: v, itemStyle: { color: [C.p, C.a, C.v, C.e, C.m][i], borderRadius: [7, 7, 0, 0] } };
          }),
          label: { show: true, position: 'top', formatter: '{c}课时', color: INK, fontFamily: FONT, fontSize: 11.5 }
        }]
      };
    },

    /* 教学环节构成（堆积条） */
    'teaching': function () {
      return {
        tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, base.tooltip),
        legend: legend(2),
        grid: { left: 40, right: 24, top: 54, bottom: 30, containLabel: true },
        xAxis: axisX(['模块一', '模块二', '模块三', '模块四', '模块五']),
        yAxis: axisY('课时'),
        series: [
          { name: '知识讲授', type: 'bar', stack: 't', barWidth: '48%', itemStyle: { color: C.p }, data: [3, 3, 3, 3, 1] },
          { name: '工具实操', type: 'bar', stack: 't', itemStyle: { color: C.a }, data: [2, 4, 3, 3, 0] },
          { name: '案例研讨 / 项目', type: 'bar', stack: 't', itemStyle: { color: C.e, borderRadius: [7, 7, 0, 0] }, data: [1, 1, 2, 2, 1] }
        ]
      };
    },

    /* 学习路径（漏斗式阶段） */
    'path': function () {
      return {
        tooltip: Object.assign({ trigger: 'item', formatter: '{b}<br/>{c}' }, base.tooltip),
        series: [{
          type: 'funnel', left: '8%', right: '8%', top: 16, bottom: 16, minSize: '28%', gap: 4,
          label: { color: '#fff', fontSize: 12, fontFamily: FONT },
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          data: [
            { value: 100, name: '认知：看懂 AI 工具全景', itemStyle: { color: C.p } },
            { value: 82, name: '会用：掌握办公与数据分析', itemStyle: { color: C.a } },
            { value: 64, name: '编排：搭建智能体', itemStyle: { color: C.v } },
            { value: 46, name: '建造：用 Harness / AI IDE 造应用', itemStyle: { color: C.e } },
            { value: 28, name: '迁移：解决专业真实问题', itemStyle: { color: C.m } }
          ]
        }]
      };
    }
  };

  function initAll() {
    if (!window.echarts) return;
    document.querySelectorAll('[data-chart]').forEach(function (el) {
      var type = el.getAttribute('data-chart');
      var builder = registry[type];
      if (!builder) return;
      var chart = echarts.init(el, null, { renderer: 'canvas' });
      var opt = builder();
      if (!opt.textStyle) opt.textStyle = base.textStyle;
      chart.setOption(opt);
      window.addEventListener('resize', function () { chart.resize(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
