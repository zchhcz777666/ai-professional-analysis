/**
 * EOL 爬虫一键全流程运行器
 *
 * 运行: node scripts/run-eol-pipeline.js
 * 功能: 依次执行 Step 1-4 完成数据爬取、解析和合并
 *
 * 前提条件:
 * 1. Node.js >= 18
 * 2. npm install (安装依赖: axios, cheerio, xlsx, pdf-parse)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

function runScript(name, scriptRelPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  [步骤] ${name}`);
  console.log(`  脚本: ${scriptRelPath}`);
  console.log(`${'='.repeat(60)}\n`);

  const scriptPath = path.join(SCRIPTS_DIR, scriptRelPath);
  if (!fs.existsSync(scriptPath)) {
    console.error(`  脚本不存在: ${scriptPath}`);
    return false;
  }

  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(SCRIPTS_DIR, '..'),
    });
    console.log(`\n  ✓ ${name} 完成\n`);
    return true;
  } catch (err) {
    console.error(`\n  ✗ ${name} 失败: ${err.message}\n`);
    return false;
  }
}

function main() {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`  高考投档线数据爬取 · 全流程`);
  console.log(`  时间: ${new Date().toISOString()}`);
  console.log(`  工作目录: ${SCRIPTS_DIR}`);
  console.log(`${'#'.repeat(60)}\n`);

  // 检查必要依赖
  const deps = ['axios', 'cheerio', 'xlsx', 'pdf-parse'];
  const missing = deps.filter(d => {
    try { require.resolve(d); return false; } catch { return true; }
  });

  if (missing.length > 0) {
    console.log(`安装缺失依赖: ${missing.join(', ')}`);
    try {
      execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit', cwd: path.join(SCRIPTS_DIR, '..') });
    } catch (err) {
      console.error(`依赖安装失败: ${err.message}`);
      console.log(`请手动运行: npm install`);
      process.exit(1);
    }
  }

  // Step 1: 爬取文章链接
  if (!runScript('爬取文章链接', 'crawl-eol-links.js')) {
    console.log('继续后续步骤...');
  }

  // Step 2: 下载文件
  if (!runScript('下载投档线文件', 'crawl-eol-files.js')) {
    console.log('继续后续步骤...');
  }

  // Step 3: 解析数据
  if (!runScript('解析数据文件', 'parse-eol-data.js')) {
    console.log('继续后续步骤...');
  }

  // Step 4: 合并数据
  if (!runScript('合并数据到 scores.json', 'merge-eol-data.js')) {
    console.log('合并失败');
  }

  console.log(`\n${'#'.repeat(60)}`);
  console.log(`  全流程完成`);
  console.log(`  输出文件:`);
  console.log(`    scripts/crawled-data/eol-articles.json - 文章索引`);
  console.log(`    scripts/crawled-data/eol-files-index.json - 文件索引`);
  console.log(`    scripts/crawled-data/eol-downloads/ - 原始文件`);
  console.log(`    scripts/crawled-data/parsed-records.json - 解析记录`);
  console.log(`    src/data/scores.json - 合并后的数据`);
  console.log(`    scripts/crawled-data/merge-report.json - 合并报告`);
  console.log(`${'#'.repeat(60)}`);
}

main();
