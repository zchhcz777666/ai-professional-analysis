/**
 * 爬虫 Step 4: 将解析的官方数据合并入 scores.json
 *
 * 运行: node scripts/merge-eol-data.js
 * 输入: scripts/crawled-data/parsed-records.json (由 parse-eol-data.js 生成)
 *       src/data/scores.json (现有数据)
 * 输出: src/data/scores.json (更新后)
 *       scripts/crawled-data/merge-report.json (合并报告)
 *
 * 合并策略:
 * 1. 官方数据（eol.cn/考试院）优先级最高
 * 2. 原始爬虫数据（dxsbb.com）次之
 * 3. 生成数据（regen_scores_realistic.js）优先级最低，仅做补位
 */
const fs = require('fs');
const path = require('path');

const PARSED_FILE = path.join(__dirname, 'crawled-data', 'parsed-records.json');
const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const REPORT_FILE = path.join(__dirname, 'crawled-data', 'merge-report.json');

async function main() {
  console.log('=== 数据合并工具 ===\n');

  // 读取现有数据和解析数据
  if (!fs.existsSync(SCORES_FILE)) {
    console.error(`未找到 scores.json: ${SCORES_FILE}`);
    process.exit(1);
  }

  const scoresData = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
  console.log(`现有数据: ${scoresData.length} 条`);

  let newRecords = [];
  if (fs.existsSync(PARSED_FILE)) {
    newRecords = JSON.parse(fs.readFileSync(PARSED_FILE, 'utf-8'));
    console.log(`新解析数据: ${newRecords.length} 条`);
  } else {
    console.log(`未找到解析数据，请先运行 parse-eol-data.js`);
    console.log(`将仅生成报告（不合并）`);
  }

  // 识别现有数据中的来源标记
  const sourceStats = {};
  for (const r of scoresData) {
    const source = r.source || 'generated';
    sourceStats[source] = (sourceStats[source] || 0) + 1;
  }

  console.log(`\n现有数据来源分布:`);
  for (const [source, count] of Object.entries(sourceStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count} 条`);
  }

  if (newRecords.length === 0) {
    console.log(`\n无新数据可合并。`);
    return;
  }

  // 建立索引: (universityId|province|year|category) → 原始记录
  const existingIndex = new Map();
  for (const r of scoresData) {
    const key = `${r.universityId}|${r.province}|${r.year}|${r.category}`;
    // 保留优先级最高的记录（eol > dxsbb > generated）
    const existing = existingIndex.get(key);
    const priority = (src) => src?.startsWith('eol:') ? 3 : src === 'dxsbb' ? 2 : 1;
    if (!existing || priority(r.source) > priority(existing.source)) {
      existingIndex.set(key, r);
    }
  }

  // 合并新数据
  let replaced = 0;
  let added = 0;

  for (const newRecord of newRecords) {
    if (!newRecord.universityId || !newRecord.province) continue;

    const key = `${newRecord.universityId}|${newRecord.province}|${newRecord.year}|${newRecord.category}`;
    const existing = existingIndex.get(key);

    if (existing) {
      // 替换：新数据（eol来源）优先级更高
      existingIndex.set(key, {
        ...existing,
        minScore: newRecord.minScore,
        avgScore: newRecord.avgScore,
        minRank: newRecord.minRank,
        enrollment: newRecord.enrollment,
        source: newRecord.source || 'eol',
      });
      replaced++;
    } else {
      // 新增
      existingIndex.set(key, {
        universityId: newRecord.universityId,
        province: newRecord.province,
        year: newRecord.year,
        category: newRecord.category,
        minScore: newRecord.minScore,
        avgScore: newRecord.avgScore || newRecord.minScore,
        minRank: newRecord.minRank,
        enrollment: newRecord.enrollment || 0,
        source: newRecord.source || 'eol',
      });
      added++;
    }
  }

  // 写回
  const mergedData = [...existingIndex.values()].sort((a, b) => {
    if (a.universityId !== b.universityId) return a.universityId.localeCompare(b.universityId);
    if (a.province !== b.province) return a.province.localeCompare(b.province);
    if (a.year !== b.year) return b.year - a.year;
    return a.category.localeCompare(b.category);
  });

  // 统计合并后的来源分布
  const newStats = {};
  for (const r of mergedData) {
    const source = r.source || 'generated';
    newStats[source] = (newStats[source] || 0) + 1;
  }

  console.log(`\n合并结果:`);
  console.log(`  替换: ${replaced} 条`);
  console.log(`  新增: ${added} 条`);
  console.log(`  总计: ${mergedData.length} 条`);
  console.log(`\n合并后来源分布:`);
  for (const [source, count] of Object.entries(newStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count} 条`);
  }

  // 写回 scores.json
  fs.writeFileSync(SCORES_FILE, JSON.stringify(mergedData));

  // 生成报告
  const report = {
    mergedAt: new Date().toISOString(),
    beforeMerge: { total: scoresData.length, sources: sourceStats },
    afterMerge: { total: mergedData.length, sources: newStats },
    changes: { replaced, added },
    files: {
      scores: SCORES_FILE,
      report: REPORT_FILE,
    },
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log(`\nscores.json: ${SCORES_FILE}`);
  console.log(`合并报告: ${REPORT_FILE}`);
}

main().catch(console.error);
